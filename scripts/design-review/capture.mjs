/* global process, Buffer, fetch, console, document, window */
// Seeds demo data, drives the running app through its main screens and takes
// screenshots on desktop and mobile. Used by .github/workflows/design-review.yml.
//
// Env: APP_URL (default http://localhost:3000), BASIC_AUTH_USER, BASIC_AUTH_PASS,
//      OUT_DIR (default ./design-review-output)
// Output: <OUT_DIR>/<viewport>/<NN-step>.png + <OUT_DIR>/report.json
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? 'design-review-output');
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

const SEED = {
  Boissons: [
    ['Café', 2],
    ['Thé', 2],
    ['Jus de pomme', 3],
    ['Bière pression', 5],
  ],
  Snacks: [
    ['Croissant', 2],
    ['Sandwich jambon-beurre', 6],
    ['Crêpe au sucre', 3],
  ],
  Desserts: [['Part de gâteau au chocolat', 4]],
};

async function api(method, route, body) {
  const res = await fetch(`${APP_URL}/api${route}`, {
    method,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// The DB migrations may already insert default data: only seed an empty DB, then
// pick a category with at least 2 products to drive the UI.
async function prepareData() {
  if ((await api('GET', '/categories')).length === 0) {
    for (const [category, products] of Object.entries(SEED)) {
      const { id: categoryId } = await api('POST', '/categories', { name: category });
      for (const [name, price] of products) {
        await api('POST', '/products', { name, price, categoryId });
      }
    }
  }
  for (const category of await api('GET', '/categories')) {
    const products = await api('GET', `/categories/${category.id}/products`);
    if (products.length >= 2)
      return { category: category.name, products: products.map((p) => p.name) };
  }
  throw new Error('No category with at least 2 products to drive the UI');
}

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  tablet: { ...devices['iPad (gen 7)'] },
  mobile: { ...devices['iPhone 13'] },
};

// Each step drives the UI then takes a screenshot. A failing step is recorded
// (that is a finding too) and the run continues with the next one.
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
  [
    'cart-confirmation-modal',
    async (page) => page.getByRole('button', { name: 'Valider' }).click(),
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
  ['order-history', async (page) => page.getByRole('button', { name: 'Historique' }).click()],
  [
    'edit-mode',
    async (page) => {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Mode Édition' }).click();
      await page.getByRole('menuitem', { name: 'Mode Édition' }).click();
    },
  ],
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const data = await prepareData();
  const STEPS = buildSteps(data);

  const report = { appUrl: APP_URL, data, viewports: {} };
  const browser = await chromium.launch();

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

    await page.goto(APP_URL, { waitUntil: 'networkidle' });

    for (const [i, [step, action]] of STEPS.entries()) {
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

  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
