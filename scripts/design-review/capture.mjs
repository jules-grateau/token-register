/* global process, Buffer, fetch, console, document, window, getComputedStyle */
// Drives a running instance of the app (the demo, in CI) through its main screens
// and takes screenshots on desktop, tablet and mobile, like a designer testing the
// real thing. Orders placed during the run are deleted at the end.
// Used by .github/workflows/design-review.yml. Can also run locally against any instance
// (e.g. a local EUR instance, or a new one, empty since D-055): when the instance has no
// category with 2 positive-priced products or no negative-priced product, the run creates a
// test catalog ("Test capture", D-057) and deletes it at the end, after its orders.
//
// Env: APP_URL (e.g. https://demo.julesgrateau.dev), BASIC_AUTH_USER, BASIC_AUTH_PASS,
//      OUT_DIR (default ./design-review-output),
//      COLOR_SCHEMES (default "light,dark": the app follows the device scheme, D-041),
//      ONLY_VIEWPORTS / ONLY_STEPS (optional comma lists, to capture only the screens a PR
//      touches, D-038; e.g. ONLY_VIEWPORTS=mobile,desktop ONLY_STEPS=home,settings-menu),
//      PHONE_LANDSCAPE_SIZES (optional, e.g. "667x300,740x320": extra phone landscape
//      viewports "mobile-landscape-667x300"..., to check the short heights of real phones),
//      KEEP_CASH_DAY_OPEN (optional, "1": set by design-review.yml on the public demos). The run
//      never closes a cash day: it uses the open one, or opens one, and leaves it open at the
//      end, so that the demo can still sell and "Journées passées" does not fill up with test
//      days (closed days cannot be deleted, D-061). The steps that close the day or need no
//      open day (CLOSING_STEPS) are skipped, with skipped: "KEEP_CASH_DAY_OPEN" in report.json.
//      Without it (PR captures, release QA: throwaway instances), every step runs.
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
const KEEP_CASH_DAY_OPEN = process.env.KEEP_CASH_DAY_OPEN === '1';
// Steps that close the cash day, or need no open day: skipped with KEEP_CASH_DAY_OPEN.
// "cash-day-close-confirm" stays: it opens the confirmation without confirming it.
const CLOSING_STEPS = ['cash-day-history', 'cash-day-orders', 'cash-day-none', 'cash-day-start'];
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

// Use the instance's catalog: pick a category with at least 2 positive-priced products,
// and any negative-priced one (deposit return) for the "total ≤ 0" screen. The test catalog
// created by this run, if any, comes first.
// Read again for each format: the demo is shared, a product renamed during the run would
// otherwise make all the following formats fail (release 2.2.0 smoke check).
async function readCatalog(firstCategoryId = null) {
  let picked = null;
  let negative = null;
  const categories = await api('GET', '/categories');
  categories.sort((a, b) => (b.id === firstCategoryId) - (a.id === firstCategoryId));
  for (const category of categories) {
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
  return { picked, negative };
}

async function pickData(firstCategoryId) {
  const { picked, negative } = await readCatalog(firstCategoryId);
  if (!picked)
    throw new Error('No category with at least 2 products on this instance to drive the UI');
  return { ...picked, negative };
}

// Test catalog (D-057): created only when a piece is missing on an instance read without
// error (no category with 2 positive-priced products, or no negative-priced product), and
// then as a whole, in its own category: the existing catalog is never modified. Names that
// can be spotted if the cleanup fails. Prices in the smallest unit of the instance currency
// (D-010, D-012): 3 / 2 / -1 tokens, 2,50 € / 1,50 € / -1,00 € (the mixed payment step
// takes 1 € in cash: the total must be above it).
const TEST_CATEGORY = 'Test capture';
const TEST_PRODUCTS = [
  ['Produit A', { TOKEN: 3, EUR: 250 }],
  ['Produit B', { TOKEN: 2, EUR: 150 }],
  ['Retour consigne', { TOKEN: -1, EUR: -100 }],
];

// Instance currency, from the runtime config that the client reads before it starts.
// Not found: stop rather than guess (TL-1 of PR #64), prices in tokens on a EUR instance
// would make a wrong test catalog without any error.
async function readCurrency() {
  const res = await fetch(`${APP_URL}/config.js`, { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`GET /config.js -> ${res.status}`);
  const currency = /"VITE_CURRENCY"\s*:\s*"(\w+)"/.exec(await res.text())?.[1];
  if (!currency) throw new Error('VITE_CURRENCY not found in /config.js');
  if (!(currency in TEST_PRODUCTS[0][1])) throw new Error(`Unknown currency ${currency}`);
  return currency;
}

// Fills `testCatalog` as it goes, so that a creation failing half-way is cleaned up too.
async function ensureTestCatalog(testCatalog) {
  const { picked, negative } = await readCatalog(); // an API error stops here: nothing created
  if (picked && negative) return;
  const currency = await readCurrency();
  const { id } = await api('POST', '/categories', { name: TEST_CATEGORY });
  testCatalog.categoryId = id;
  for (const [name, prices] of TEST_PRODUCTS) {
    const product = await api('POST', '/products', {
      name,
      price: prices[currency],
      categoryId: id,
    });
    testCatalog.productIds.push(product.id);
  }
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
  // Real phone in landscape: the browser bars leave about 300 px of height (2.2.1: pop-ups
  // stuck out of the screen there).
  'mobile-landscape-short': phoneLandscape(667, 300),
  // Short desktop, like a 1080p PC zoomed to 150 % (D-052: "Enregistrer" must stay visible).
  'desktop-short': { viewport: { width: 1280, height: 600 } },
};
for (const size of list(process.env.PHONE_LANDSCAPE_SIZES) ?? []) {
  const [width, height] = size.split('x').map(Number);
  VIEWPORTS[`mobile-landscape-${size}`] = phoneLandscape(width, height);
}
// Captured only when asked for in ONLY_VIEWPORTS (not in the release smoke check by default).
const OPT_IN_VIEWPORTS = ['desktop-short'];

function phoneLandscape(width, height) {
  return { ...devices['iPhone 13 landscape'], viewport: { width, height }, deviceScaleFactor: 1 };
}

// Pop-ups (modal, drawer, menu, list of options) that stick out of the window, or with a
// control that cannot be reached: the hidden part is lost, the page behind does not scroll
// (2.2.1, phone in landscape). A pop-up taller than the window must scroll inside instead.
// Runs in the page; one entry per problem.
function findPopupOverflow() {
  const POPUPS = [
    '.mantine-Modal-content',
    '.mantine-Drawer-content',
    '.mantine-Menu-dropdown',
    '.mantine-Popover-dropdown',
    '.mantine-Combobox-dropdown',
  ].join(',');
  const CONTROLS =
    'button, input:not([type="hidden"]), textarea, [role="option"], [role="menuitem"]';
  const W = window.innerWidth;
  const H = window.innerHeight;
  const TOLERANCE = 1; // sub-pixel rounding
  const scrolls = (el) => {
    const { overflowX, overflowY } = getComputedStyle(el);
    return (
      (/auto|scroll/.test(overflowY) && el.scrollHeight > el.clientHeight + TOLERANCE) ||
      (/auto|scroll/.test(overflowX) && el.scrollWidth > el.clientWidth + TOLERANCE)
    );
  };
  const found = [];
  for (const popup of document.querySelectorAll(POPUPS)) {
    const r = popup.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(popup).visibility === 'hidden') continue;
    const name = (
      popup.querySelector('h2')?.textContent?.trim() ||
      [...popup.classList].find((c) => c.startsWith('mantine-')) ||
      popup.tagName
    ).slice(0, 40);
    const sides = [];
    if (r.top < -TOLERANCE) sides.push(`top ${Math.round(r.top)} < 0`);
    if (r.bottom > H + TOLERANCE) sides.push(`bottom ${Math.round(r.bottom)} > ${H}`);
    if (r.left < -TOLERANCE) sides.push(`left ${Math.round(r.left)} < 0`);
    if (r.right > W + TOLERANCE) sides.push(`right ${Math.round(r.right)} > ${W}`);
    if (sides.length) found.push(`${name}: ${sides.join(', ')}`);

    // A control outside the visible area (window and clipping parents), with no scrolling
    // parent in the pop-up to bring it back: it cannot be used.
    for (const control of popup.querySelectorAll(CONTROLS)) {
      const c = control.getBoundingClientRect();
      if (!c.width || !c.height || control.closest('[aria-hidden="true"]')) continue;
      let visible = { top: 0, bottom: H, left: 0, right: W };
      let reachable = false;
      let folded = false; // inside a closed Collapse: hidden on purpose
      for (let el = control.parentElement; el && el !== document.body; el = el.parentElement) {
        if (getComputedStyle(el).overflow === 'visible') continue;
        const e = el.getBoundingClientRect();
        if (e.height < 1 || e.width < 1) folded = true;
        if (popup.contains(el) && scrolls(el)) reachable = true;
        visible = {
          top: Math.max(visible.top, e.top),
          bottom: Math.min(visible.bottom, e.bottom),
          left: Math.max(visible.left, e.left),
          right: Math.min(visible.right, e.right),
        };
      }
      const inside =
        c.top >= visible.top - TOLERANCE &&
        c.bottom <= visible.bottom + TOLERANCE &&
        c.left >= visible.left - TOLERANCE &&
        c.right <= visible.right + TOLERANCE;
      if (inside || reachable || folded) continue;
      const label = (
        control.getAttribute('aria-label') ||
        control.textContent?.trim() ||
        control.getAttribute('placeholder') ||
        control.tagName
      ).slice(0, 30);
      found.push(
        `${name}: "${label}" out of reach (${Math.round(c.top)}-${Math.round(c.bottom)} px, window ${H})`
      );
    }
  }
  return found;
}

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
async function fillHistory(product, currency, createdOrders) {
  const { pagination } = await api('GET', '/orders?page=1&pageSize=20');
  const items = [{ product, quantity: 1, discountedAmount: 0 }];
  const payment = currency === 'EUR' ? { cashAmount: null, cardAmount: product.price } : undefined;
  for (let n = pagination.totalCount; n < HISTORY_ORDERS; n++) {
    const order = await api('POST', '/orders', { items, payment });
    if (order?.id) createdOrders.push({ id: order.id, cashDayId: order.cashDayId });
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
    // Scrolled to the bottom (issue #38): the pagination and "Affichage de 20 sur 21" are in
    // the window. Fails if the pagination is missing, as the history has more than 20 orders.
    'order-history',
    async (page, { currency, createdOrders }) => {
      await closeOverlays(page);
      await fillHistory(sample, currency, createdOrders);
      await page.getByRole('button', { name: 'Historique' }).first().click();
      const pagination = dialog(page).locator('.mantine-Pagination-root');
      await pagination.waitFor({ timeout: 5000 });
      // The modal opens with a transition, and the focus moves into it once open, which scrolls
      // its content back to the top: a scroll done before that is lost (release QA of PR #71,
      // EUR, desktop and tablet). Wait for the end of the transitions, then scroll, and scroll
      // again for a moment if the content still moved back.
      // Infinite animations (loaders) never finish, and a cancelled one rejects: neither must
      // stop the step (TL-1 of PR #72).
      await dialog(page).evaluate((el) =>
        Promise.all(
          el
            .getAnimations({ subtree: true })
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {}))
        )
      );
      const { height } = page.viewportSize();
      const paginationInWindow = async () => {
        const box = await pagination.boundingBox();
        return !!box && box.y >= 0 && box.y + box.height <= height;
      };
      const scrolledToPagination = async () => {
        // The Stack of the pagination and its count; block "end" scrolls every scrolling
        // parent. Instant: done when the call returns, no smooth scrolling (TL-1 of PR #66).
        await pagination.evaluate((el) =>
          el.parentElement.scrollIntoView({ block: 'end', behavior: 'instant' })
        );
        return paginationInWindow();
      };
      let inWindow = await scrolledToPagination();
      for (let i = 0; i < 5 && !inWindow; i++) {
        await page.waitForTimeout(200);
        inWindow = await scrolledToPagination();
      }
      if (!inWindow) throw new Error('History pagination not in the window after scrolling');
      // Checked again after the same pause as before the screenshot: nothing scrolled it back
      // in the meantime (TL-2 of PR #72).
      await page.waitForTimeout(300);
      if (!(await paginationInWindow()))
        throw new Error('History pagination scrolled out of the window before the screenshot');
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
    // List of options of a Select, over the form (2.2.1: it must stay in the window).
    'new-product-category-list',
    async (page) =>
      dialog(page)
        .getByLabel(/^Catégorie/)
        .first()
        .click(),
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
    // Menu of a cart line (2.2.1: it must stay in the window).
    'cart-item-menu',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('button', { name: 'Terminer' }).click();
      await page.getByRole('tabpanel').getByText(first, { exact: true }).first().click();
      await openCartIfCollapsed(page);
      await page.getByRole('button', { name: "Plus d'actions" }).last().click();
    },
  ],
  [
    'discount-modal',
    async (page) => page.getByRole('menuitem', { name: 'Appliquer une réduction' }).click(),
  ],
  [
    // Settings menu scrolled to the bottom (DS-1 of PR #58): on a short phone in landscape it
    // scrolls; "À propos", the last item, must then be in the window and clickable.
    // Added at the end, so that the numbers of the other screenshots stay the same.
    'settings-menu-scrolled',
    async (page) => {
      await closeOverlays(page);
      await page.getByRole('button', { name: 'Mode Édition', exact: true }).click();
      await page.waitForTimeout(300);
      await page
        .locator('.mantine-Menu-dropdown')
        .evaluate((menu) => menu.scrollTo({ top: menu.scrollHeight }));
      await page.waitForTimeout(200);
      const about = page.getByRole('menuitem', { name: 'À propos' });
      const box = await about.boundingBox();
      const { height } = page.viewportSize();
      if (!box || box.y < 0 || box.y + box.height > height)
        throw new Error(`"À propos" not in the window after scrolling the menu`);
      // Actionability only (visible, enabled, not covered): the menu stays open.
      await about.click({ trial: true, timeout: 5000 });
    },
  ],
  // Cash day (D-061), after the other steps so that their numbers stay the same. Each format
  // starts with an open day (see setCashDay in run()); these steps close it, except with
  // KEEP_CASH_DAY_OPEN (CLOSING_STEPS are then skipped).
  [
    // The open day after the sales of this run: net total, cash / card in euros, orders.
    'cash-day-summary',
    async (page) => {
      await closeOverlays(page);
      await setCashDay(page, true);
      await openSettingsItem(page, 'Journée de caisse');
      await dialog(page).getByTestId('cash-day-summary').waitFor({ timeout: 5000 });
    },
  ],
  [
    // Confirmation with the final totals (D-050): not confirmed yet.
    'cash-day-close-confirm',
    async (page) => {
      await dialog(page).getByRole('button', { name: 'Terminer la journée', exact: true }).click();
      await page.getByRole('dialog', { name: 'Terminer la journée ?' }).waitFor({ timeout: 5000 });
    },
  ],
  [
    // Confirmed: the recap of the closed day, then "Journées passées" (at least this day).
    'cash-day-history',
    async (page) => {
      await page
        .getByRole('dialog', { name: 'Terminer la journée ?' })
        .getByRole('button', { name: 'Terminer la journée', exact: true })
        .click();
      await page.getByText('Journée terminée', { exact: true }).waitFor({ timeout: 5000 });
      await page.waitForTimeout(400); // the confirmation closes
      await page
        .getByRole('button', { name: /^Voir les commandes de la journée/ })
        .first()
        .scrollIntoViewIfNeeded();
    },
  ],
  [
    // Orders of a closed day, where they can be deleted (answer 16 a).
    'cash-day-orders',
    async (page) => {
      await page
        .getByRole('button', { name: /^Voir les commandes de la journée/ })
        .first()
        .click();
      await page.getByRole('dialog', { name: /^Commandes du / }).waitFor({ timeout: 5000 });
    },
  ],
  [
    // No day open: the header says so and the banner over the cart starts the day; "Valider"
    // is disabled (answer 19 a). The cart keeps the product of the previous steps.
    'cash-day-none',
    async (page) => {
      await closeOverlays(page);
      await setCashDay(page, false);
      await page.getByTestId('no-cash-day-banner').first().waitFor({ timeout: 5000 });
    },
  ],
  [
    // "Journée de caisse" without an open day: "Démarrer la journée" (not touched).
    'cash-day-start',
    async (page) => {
      await closeOverlays(page);
      await setCashDay(page, false);
      await openSettingsItem(page, 'Journée de caisse');
      await dialog(page)
        .getByRole('button', { name: 'Démarrer la journée', exact: true })
        .waitFor({ timeout: 5000 });
    },
  ],
  [
    // D-062 (issue #92): "−" at quantity 1 removes the line; no line stays at 0.
    'cart-quantity-zero',
    async (page) => {
      await closeOverlays(page);
      await openCartIfCollapsed(page);
      const clear = page.getByRole('button', { name: 'Vider le panier' }).last();
      if (await clear.isEnabled().catch(() => false)) await clear.click();
      await closeOverlays(page);
      await page.getByRole('tabpanel').getByText(first, { exact: true }).first().click();
      await openCartIfCollapsed(page);
      const minus = page.getByRole('button', { name: 'Moins', exact: true });
      if ((await minus.count()) !== 1) {
        throw new Error(`Expected 1 cart line at quantity 1, got ${await minus.count()}`);
      }
      await minus.click();
      await page.waitForTimeout(300);
      if ((await minus.count()) !== 0) {
        throw new Error('The cart line is still there after "−" at quantity 1');
      }
      await page
        .getByText('Votre panier est vide.', { exact: true })
        .last()
        .waitFor({ timeout: 5000 });
    },
  ],
];

// D-061: no sale without an open cash day. Opens or closes the day through the API, then
// reloads the page if that changed anything. Closing a day keeps its orders (deleted at the
// end through their day, see run()); the closed days stay in "Journées passées".
async function setCashDay(page, open) {
  if (!open && KEEP_CASH_DAY_OPEN)
    throw new Error('KEEP_CASH_DAY_OPEN: the cash day is not closed');
  const { cashDay } = await api('GET', '/cash-days/current');
  if (open === !!cashDay) return;
  await api('POST', open ? '/cash-days' : '/cash-days/current/close');
  if (page) await page.reload({ waitUntil: 'networkidle' });
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // { id, cashDayId }: deleted through their cash day, open or closed (D-061).
  const createdOrders = [];
  const testCatalog = { categoryId: null, productIds: [] };

  const report = { appUrl: APP_URL, data: null, viewports: {}, cleanup: null };
  const browser = await chromium.launch();

  try {
    await ensureTestCatalog(testCatalog);
    const data = await pickData(testCatalog.categoryId);
    report.data = data;
    let catalog = data; // last catalog read, kept when a later read fails (TL-1 of PR #50)
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
      // One retry, then the previous catalog with a warning: a transient API error must not
      // fail the whole run.
      const warnings = [];
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          catalog = await pickData(testCatalog.categoryId);
          break;
        } catch (e) {
          if (attempt === 2)
            warnings.push(`catalog not read again, previous one used: ${String(e).split('\n')[0]}`);
        }
      }
      const vpData = catalog;
      const STEPS = buildSteps(vpData);
      const vp = {
        size: page.viewportSize(),
        // Only when the catalog changed since the start of the run.
        ...(JSON.stringify(vpData) !== JSON.stringify(data) ? { data: vpData } : {}),
        ...(warnings.length ? { warnings } : {}),
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
          if (body?.id) createdOrders.push({ id: body.id, cashDayId: body.cashDayId });
        }
      });

      // D-061: the sales of the first steps need an open cash day.
      await setCashDay(null, true);
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
        if (KEEP_CASH_DAY_OPEN && CLOSING_STEPS.includes(step)) {
          vp.steps.push({ step, skipped: 'KEEP_CASH_DAY_OPEN' });
          continue;
        }
        const file = path.join(dir, `${String(i + 1).padStart(2, '0')}-${step}.png`);
        let error = null;
        try {
          await action(page, { currency, createdOrders });
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
        const popupOverflow = await page.evaluate(findPopupOverflow);
        vp.steps.push({
          step,
          screenshot: path.relative(OUT_DIR, file),
          error,
          overflowX,
          ...(popupOverflow.length ? { popupOverflow } : {}),
        });
      }

      report.viewports[name] = vp;
      await context.close();
    }
  } finally {
    await browser.close();
    const failed = [];
    // Through their cash day (D-061): an order of a closed day cannot be deleted from /orders.
    for (const { id, cashDayId } of createdOrders) {
      await api('DELETE', `/cash-days/${cashDayId}/orders/${id}`).catch(() => failed.push(id));
    }
    report.cleanup = {
      deletedOrders: createdOrders.map(({ id }) => id).filter((id) => !failed.includes(id)),
      failed,
    };
    // The demo is left with an open day, so that a visitor can sell (never closed by this run).
    if (KEEP_CASH_DAY_OPEN) {
      report.cleanup.cashDayOpen = await setCashDay(null, true)
        .then(() => true)
        .catch(() => false);
    }
    // After the orders: deleting the category deletes its products too. Order lines keep
    // the product name and price (order history preservation, spec 002).
    if (testCatalog.categoryId) {
      const deleted = await api('DELETE', `/categories/${testCatalog.categoryId}`)
        .then(() => true)
        .catch(() => false);
      report.cleanup.testCatalog = {
        category: testCatalog.categoryId,
        products: testCatalog.productIds,
        deleted,
      };
    }
    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
