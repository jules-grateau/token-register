/* global process, Buffer, fetch, console, document, window */
// Drives a running instance of the app (the demo, in CI) through its main screens
// and takes screenshots on desktop, tablet and mobile, like a designer testing the
// real thing. Orders placed during the run are deleted at the end.
// Used by .github/workflows/design-review.yml. Can also run locally against any instance
// (e.g. a local EUR instance); the instance needs a category with at least 2 products.
//
// Env: APP_URL (e.g. https://demo.julesgrateau.dev), BASIC_AUTH_USER, BASIC_AUTH_PASS,
//      OUT_DIR (default ./design-review-output),
//      COLOR_SCHEMES (default "light,dark": the app follows the device scheme, D-041),
//      ONLY_VIEWPORTS / ONLY_STEPS (optional comma lists, to capture only the screens a PR
//      touches, D-038; e.g. ONLY_VIEWPORTS=mobile,desktop ONLY_STEPS=home,settings-menu)
// Output: <OUT_DIR>/<viewport>-<scheme>/<NN-step>.png + <OUT_DIR>/report.json
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const APP_URL = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? 'design-review-output');
const list = (value) =>
  value
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : null;
const COLOR_SCHEMES = list(process.env.COLOR_SCHEMES) ?? ['light', 'dark'];
const ONLY_VIEWPORTS = list(process.env.ONLY_VIEWPORTS);
const ONLY_STEPS = list(process.env.ONLY_STEPS);
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

async function api(method, route, body) {
  const res = await fetch(`${APP_URL}/api${route}`, {
    method,
    headers: { Authorization: AUTH, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Use the instance's existing catalog: pick a category with at least 2 positive-priced
// products, and any negative-priced one (deposit return) for the "total ≤ 0" screen.
// Read again for each format: the demo is shared, a product renamed during the run would
// otherwise make all the following formats fail (release 2.2.0 smoke check).
async function pickData() {
  let picked = null;
  let negative = null;
  for (const category of await api('GET', '/categories')) {
    const products = await api('GET', `/categories/${category.id}/products`);
    const positive = products.filter((p) => p.price > 0);
    if (!picked && positive.length >= 2)
      picked = {
        category: category.name,
        products: positive.map((p) => p.name),
        sample: positive[0],
      };
    negative ??= products.find((p) => p.price < 0)?.name ?? null;
  }
  if (!picked)
    throw new Error('No category with at least 2 products on this instance to drive the UI');
  return { ...picked, negative };
}

// Layout modes (docs/design/spacing-layout.md): desktop, tablet, phone portrait, phone landscape.
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  // deviceScaleFactor 1: same layout and text sizes as on the device, but ~5x fewer
  // image tokens for the designer review than retina captures (D-038).
  tablet: { ...devices['iPad (gen 7)'], deviceScaleFactor: 1 },
  'tablet-landscape': { ...devices['iPad (gen 7) landscape'], deviceScaleFactor: 1 },
  mobile: { ...devices['iPhone 13'], deviceScaleFactor: 1 },
  'mobile-landscape': { ...devices['iPhone 13 landscape'], deviceScaleFactor: 1 },
  // Short desktop, like a 1080p PC zoomed to 150 % (D-052: "Enregistrer" must stay visible).
  'desktop-short': { viewport: { width: 1280, height: 600 } },
};
// Captured only when asked for in ONLY_VIEWPORTS (not in the release smoke check by default).
const OPT_IN_VIEWPORTS = ['desktop-short'];

// Closes whatever modal, Drawer or menu is open, and lets the transition end. A confirmation
// opened over another modal (delete an order from the history) needs one Escape per layer.
async function closeOverlays(page) {
  for (let i = 0; i < 3; i++) {
    // "Enregistrer les modifications ?" (D-052): Escape goes back to the form, so discard.
    const discard = page.getByRole('button', { name: 'Ne pas enregistrer' });
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
      await page.waitForTimeout(300);
      continue;
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (
      !(await page
        .getByRole('dialog')
        .first()
        .isVisible()
        .catch(() => false))
    )
      return;
  }
}

// Types in the first field of the open form, then closes it with Escape: as the form has
// changes, "Enregistrer les modifications ?" opens (D-052). Not saved: closeOverlays discards.
async function askToCloseWithChanges(page) {
  await dialog(page).getByRole('textbox').first().fill('Modifié');
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

const dialog = (page) => page.getByRole('dialog');

// "Valider" of the cart (also on the collapsed phone bar); with the phone Drawer open, the
// last one is the Drawer's.
async function checkout(page) {
  await page.getByRole('button', { name: 'Valider', exact: true }).last().click();
  await page.waitForTimeout(300);
}

// Adds one product from the catalog shown (all categories after an order), then checks out.
async function sellOne(page, product) {
  await closeOverlays(page);
  await page.getByRole('tabpanel').getByText(product, { exact: true }).first().click();
  await checkout(page);
}

async function waitForToast(page) {
  await page.waitForTimeout(800); // toast animation
}

// Each step drives the UI then takes a screenshot. A failing step is recorded
// (that is a finding too) and the run continues with the next one.
// `only`: viewports where the step makes sense; `currency`: instances where it does
// (EUR or TOKEN). It is skipped elsewhere.
// The history shows 20 orders per page: past that, the pagination appears (DS-4 of PR #31).
// Orders created here are deleted at the end with the others.
const HISTORY_ORDERS = 21;
async function fillHistory(product, currency, createdOrderIds) {
  const { pagination } = await api('GET', '/orders?page=1&pageSize=20');
  const items = [{ product, quantity: 1, discountedAmount: 0 }];
  const payment = currency === 'EUR' ? { cashAmount: null, cardAmount: product.price } : undefined;
  for (let n = pagination.totalCount; n < HISTORY_ORDERS; n++) {
    const order = await api('POST', '/orders', { items, payment });
    if (order?.id) createdOrderIds.push(order.id);
  }
}

const buildSteps = ({ category, products: [first, second], negative, sample }) => [
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
  // "Encaissement" (docs/design/components.md, D-053): the mode first in EUR; the recap and
  // "Encaisser" only in tokens.
  ['payment-modal', async (page) => checkout(page)],
  [
    // Card: prefilled with the amount due.
    'payment-card-prefilled',
    async (page) => dialog(page).getByRole('button', { name: 'Carte', exact: true }).click(),
    { currency: 'EUR' },
  ],
  [
    // Cash: the exact amount first, then a suggested note with change.
    'payment-cash-suggested-change',
    async (page) => {
      // Phone: the card keypad takes the screen, "← Moyens" goes back to the modes.
      const back = dialog(page).getByRole('button', { name: 'Moyens', exact: true });
      if (await back.isVisible().catch(() => false)) await back.click();
      await dialog(page).getByRole('button', { name: 'Espèces', exact: true }).click();
      await dialog(page)
        .getByRole('button', { name: /^Reçu / })
        .nth(1)
        .click();
    },
    { currency: 'EUR' },
  ],
  [
    // 1 € in cash, "Ajouter": the part is listed (with its delete button), back to the modes.
    'payment-mixed-parts',
    async (page) => {
      const other = dialog(page).getByRole('button', { name: 'Autre montant' });
      if (await other.isVisible().catch(() => false)) await other.click();
      await dialog(page).getByRole('button', { name: '1', exact: true }).click();
      await dialog(page).getByRole('button', { name: 'Ajouter', exact: true }).click();
    },
    { currency: 'EUR' },
  ],
  [
    // EUR: the card is prefilled with the rest, then "Encaisser". Tokens: "Encaisser".
    'order-placed-mixed-or-tokens',
    async (page, { currency }) => {
      if (currency === 'EUR') {
        await dialog(page).getByRole('button', { name: 'Carte', exact: true }).click();
      }
      await dialog(page).getByRole('button', { name: 'Encaisser', exact: true }).click();
      await waitForToast(page);
    },
  ],
  [
    'order-placed-card',
    async (page) => {
      await sellOne(page, first);
      await dialog(page).getByRole('button', { name: 'Carte', exact: true }).click();
      await dialog(page).getByRole('button', { name: 'Encaisser', exact: true }).click();
      await waitForToast(page);
    },
    { currency: 'EUR' },
  ],
  [
    // Cash, exact amount: the first suggestion, then "Encaisser".
    'order-placed-exact',
    async (page) => {
      await sellOne(page, second);
      await dialog(page).getByRole('button', { name: 'Espèces', exact: true }).click();
      await dialog(page)
        .getByRole('button', { name: /^Reçu / })
        .first()
        .click();
      await dialog(page).getByRole('button', { name: 'Encaisser', exact: true }).click();
      await waitForToast(page);
    },
    { currency: 'EUR' },
  ],
  [
    // Negative total (deposit return, D-013): the mode then "Rembourser" in EUR (the mode is
    // chosen here, to show the enabled button), "Rembourser" only in tokens.
    'payment-negative-total',
    async (page, { currency }) => {
      if (!negative) throw new Error('No negative-priced product on this instance');
      await sellOne(page, negative);
      if (currency === 'EUR') {
        await dialog(page).getByRole('button', { name: 'Espèces', exact: true }).click();
      }
    },
  ],
  [
    'order-history',
    async (page, { currency, createdOrderIds }) => {
      await closeOverlays(page);
      await fillHistory(sample, currency, createdOrderIds);
      await page.getByRole('button', { name: 'Historique' }).first().click();
    },
  ],
  [
    // Confirmation over the history (D-020, D-050): not confirmed, the order stays.
    'order-delete-confirm',
    async (page) => {
      await dialog(page).getByRole('button', { name: 'Supprimer', exact: true }).first().click();
    },
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
    // Settings menu: edit mode, light / dark switch (D-041), currency, "À propos".
    'settings-menu',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('button', { name: 'Mode Édition', exact: true }).click();
      await page.waitForTimeout(300);
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
  ['edit-category-unsaved', async (page) => askToCloseWithChanges(page)],
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
  ['edit-product-unsaved', async (page) => askToCloseWithChanges(page)],
  [
    'new-product-form',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('tabpanel').getByRole('button', { name: 'Nouveau Produit' }).click();
      // Unfold the icon picker (D-046), so that the grid of icons is reviewed too.
      await dialog(page).getByRole('button', { name: 'Choisir une icône' }).click();
    },
  ],
  [
    'new-category-form',
    async (page) => {
      await closeOverlays(page);
      // Dashed last tab (row of tabs) or NewCategoryButton (column of tabs).
      await page.getByRole('button', { name: 'Nouvelle Catégorie' }).first().click();
    },
  ],
  [
    // Not confirmed: the product stays.
    'product-delete-confirm',
    async (page) => {
      await closeOverlays(page);
      await page
        .getByRole('tabpanel')
        .getByRole('button', { name: 'Supprimer', exact: true })
        .first()
        .click();
    },
  ],
  [
    'discount-modal',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('button', { name: 'Terminer' }).click();
      await page.getByRole('tabpanel').getByText(first, { exact: true }).first().click();
      await openCartIfCollapsed(page);
      await page.getByRole('button', { name: "Plus d'actions" }).last().click();
      await page.getByRole('menuitem', { name: 'Appliquer une réduction' }).click();
    },
  ],
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const data = await pickData();
  const createdOrderIds = [];

  const report = { appUrl: APP_URL, data, viewports: {}, cleanup: null };
  const browser = await chromium.launch();

  try {
    const runs = Object.entries(VIEWPORTS)
      .filter(([viewport]) =>
        ONLY_VIEWPORTS ? ONLY_VIEWPORTS.includes(viewport) : !OPT_IN_VIEWPORTS.includes(viewport)
      )
      .flatMap(([viewport, options]) =>
        COLOR_SCHEMES.map((colorScheme) => [viewport, colorScheme, options])
      );
    for (const [viewport, colorScheme, options] of runs) {
      const name = `${viewport}-${colorScheme}`;
      const dir = path.join(OUT_DIR, name);
      fs.mkdirSync(dir, { recursive: true });
      const context = await browser.newContext({
        ...options,
        colorScheme,
        locale: 'fr-FR',
        httpCredentials: { username: USER, password: PASS },
      });
      const page = await context.newPage();
      const vpData = await pickData();
      const STEPS = buildSteps(vpData);
      const vp = {
        size: page.viewportSize(),
        // Only when the catalog changed since the start of the run.
        ...(JSON.stringify(vpData) !== JSON.stringify(data) ? { data: vpData } : {}),
        steps: [],
        consoleErrors: [],
        pageErrors: [],
      };
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
      const currency = await page.evaluate(() => window.APP_CONFIG?.VITE_CURRENCY ?? 'TOKEN');
      report.currency = currency;

      for (const [i, [step, action, { only, currency: onlyCurrency } = {}]] of STEPS.entries()) {
        if (
          (only && !only.includes(viewport)) ||
          (onlyCurrency && onlyCurrency !== currency) ||
          (ONLY_STEPS && !ONLY_STEPS.includes(step))
        ) {
          vp.steps.push({ step, skipped: true });
          continue;
        }
        const file = path.join(dir, `${String(i + 1).padStart(2, '0')}-${step}.png`);
        let error = null;
        try {
          await action(page, { currency, createdOrderIds });
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
