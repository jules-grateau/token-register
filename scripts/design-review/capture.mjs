/* global process, Buffer, fetch, console, document, window */
// Drives a running instance of the app (the demo, in CI) through its main screens
// and takes screenshots on desktop, tablet and mobile, like a designer testing the
// real thing. Orders placed during the run are deleted at the end.
// Used by .github/workflows/design-review.yml. Can also run locally against any instance
// (e.g. a local EUR instance); the instance needs a category with at least 2 products.
//
// Env: APP_URL (e.g. https://demo.julesgrateau.dev), BASIC_AUTH_USER, BASIC_AUTH_PASS,
//      OUT_DIR (default ./design-review-output)
// Output: <OUT_DIR>/<viewport>/<NN-step>.png + <OUT_DIR>/report.json
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const APP_URL = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? 'design-review-output');
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

async function api(method, route) {
  const res = await fetch(`${APP_URL}/api${route}`, { method, headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Use the instance's existing catalog: pick a category with at least 2 products.
async function pickData() {
  for (const category of await api('GET', '/categories')) {
    const products = await api('GET', `/categories/${category.id}/products`);
    if (products.length >= 2)
      return { category: category.name, products: products.map((p) => p.name) };
  }
  throw new Error('No category with at least 2 products on this instance to drive the UI');
}

// Layout modes (docs/design/spacing-layout.md): desktop, tablet, phone portrait, phone landscape.
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  tablet: { ...devices['iPad (gen 7)'] },
  mobile: { ...devices['iPhone 13'] },
  'mobile-landscape': { ...devices['iPhone 13 landscape'] },
};

// Closes whatever modal, Drawer or menu is open, and lets the transition end.
async function closeOverlays(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

async function openSettingsItem(page, item) {
  // The settings button is labelled "Mode Édition" (aria-label of the ⚙️ icon).
  await page.getByRole('button', { name: 'Mode Édition', exact: true }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

// Phone portrait: the cart is a collapsed bar that opens a Drawer ("Voir le panier").
async function openCartIfCollapsed(page) {
  const openCart = page.getByRole('button', { name: 'Voir le panier' }).first();
  if (await openCart.isVisible().catch(() => false)) {
    await openCart.click();
    await page.waitForTimeout(400);
  }
}

// Each step drives the UI then takes a screenshot. A failing step is recorded
// (that is a finding too) and the run continues with the next one.
// `only`: viewports where the step makes sense; it is skipped elsewhere.
const buildSteps = ({ category, products: [first, second] }) => [
  ['home', async () => {}],
  [
    'category-selected',
    async (page) => page.getByRole('tab').filter({ hasText: category }).first().click(),
  ],
  [
    'cart-with-items',
    async (page) => {
      const catalog = page.getByRole('tabpanel');
      await catalog.getByText(first, { exact: true }).first().click();
      await catalog.getByText(first, { exact: true }).first().click();
      await catalog.getByText(second, { exact: true }).first().click();
    },
  ],
  ['cart-drawer', async (page) => openCartIfCollapsed(page), { only: ['mobile'] }],
  [
    'cart-confirmation-modal',
    // With the Drawer open, the last "Valider" is the Drawer's one.
    async (page) => page.getByRole('button', { name: 'Valider', exact: true }).last().click(),
  ],
  [
    'order-placed',
    async (page) => {
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Confirmer', exact: true })
        .click();
      await page.waitForTimeout(800); // toast animation
    },
  ],
  [
    'order-history',
    async (page) => page.getByRole('button', { name: 'Historique' }).first().click(),
  ],
  [
    'cart-cleared-toast',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('tabpanel').getByText(first, { exact: true }).first().click();
      await openCartIfCollapsed(page);
      await page.getByRole('button', { name: 'Vider le panier' }).last().click();
      await page.waitForTimeout(600); // toast animation
    },
  ],
  [
    'about-modal',
    async (page) => {
      await closeOverlays(page);
      await openSettingsItem(page, 'À propos');
    },
  ],
  [
    'edit-mode',
    async (page) => {
      await closeOverlays(page);
      await openSettingsItem(page, 'Mode Édition');
      // Placing an order goes back to "all categories": select the category again.
      await page.getByRole('tab').filter({ hasText: category }).first().click();
    },
  ],
  [
    'edit-category-form',
    async (page) => {
      // Toolbar (phone portrait), end of the tab row (phone landscape) or column of tabs.
      await page
        .getByTestId('category-toolbar')
        .getByRole('button', { name: 'Modifier', exact: true })
        .or(page.getByRole('button', { name: 'Modifier la Catégorie', exact: true }))
        .or(page.getByRole('tablist').getByRole('button', { name: 'Modifier', exact: true }))
        .first()
        .click();
    },
  ],
  [
    'edit-product-form',
    async (page) => {
      await closeOverlays(page);
      await page
        .getByRole('tabpanel')
        .getByRole('button', { name: 'Modifier', exact: true })
        .first()
        .click();
    },
  ],
  [
    'new-product-form',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('tabpanel').getByRole('button', { name: 'Nouveau Produit' }).click();
    },
  ],
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const data = await pickData();
  const STEPS = buildSteps(data);
  const createdOrderIds = [];

  const report = { appUrl: APP_URL, data, viewports: {}, cleanup: null };
  const browser = await chromium.launch();

  try {
    for (const [name, options] of Object.entries(VIEWPORTS)) {
      const dir = path.join(OUT_DIR, name);
      fs.mkdirSync(dir, { recursive: true });
      const context = await browser.newContext({
        ...options,
        locale: 'fr-FR',
        httpCredentials: { username: USER, password: PASS },
      });
      const page = await context.newPage();
      const vp = { size: page.viewportSize(), steps: [], consoleErrors: [], pageErrors: [] };
      page.on('console', (m) => m.type() === 'error' && vp.consoleErrors.push(m.text()));
      page.on('pageerror', (e) => vp.pageErrors.push(String(e)));
      // Track the orders this run creates, to delete exactly those afterwards.
      page.on('response', async (res) => {
        if (res.request().method() === 'POST' && /\/api\/orders\/?$/.test(res.url()) && res.ok()) {
          const body = await res.json().catch(() => null);
          if (body?.id) createdOrderIds.push(body.id);
        }
      });

      await page.goto(APP_URL, { waitUntil: 'networkidle' });

      for (const [i, [step, action, { only } = {}]] of STEPS.entries()) {
        if (only && !only.includes(name)) {
          vp.steps.push({ step, skipped: true });
          continue;
        }
        const file = path.join(dir, `${String(i + 1).padStart(2, '0')}-${step}.png`);
        let error = null;
        try {
          await action(page);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(300); // let transitions settle
        } catch (e) {
          error = String(e).split('\n')[0];
        }
        await page.screenshot({ path: file, fullPage: true });
        // Horizontal overflow is a common responsive bug: record it explicitly.
        const overflowX = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        vp.steps.push({ step, screenshot: path.relative(OUT_DIR, file), error, overflowX });
      }

      report.viewports[name] = vp;
      await context.close();
    }
  } finally {
    await browser.close();
    const failed = [];
    for (const id of createdOrderIds) {
      await api('DELETE', `/orders/${id}`).catch(() => failed.push(id));
    }
    report.cleanup = {
      deletedOrders: createdOrderIds.filter((id) => !failed.includes(id)),
      failed,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
