/* global process, Buffer, fetch, console, setTimeout */
// Demo catalog of the EUR demo instance (D-059), run by ci-cd.yml after each demo deploy.
// Lives outside the app on purpose: a new database starts empty and the app itself never
// creates a catalog (D-055). This script only talks to the API of a running instance, and:
//   - fills the catalog only when the instance has no category and no product at all;
//   - never modifies, nor deletes, anything that already exists (a second run does nothing);
//   - refuses an instance that is not in euros (wrong URL in the secrets): it exits 1.
// A creation failing half-way deletes what this run created, so that the next run starts
// again from an empty catalog, then exits 1.
//
// Env: APP_URL, BASIC_AUTH_USER, BASIC_AUTH_PASS,
//      WAIT_SECONDS (optional, default 90: how long to wait for the API after a restart).
// Never prints the URL: it is a secret, and the Actions logs are public.

const APP_URL = (process.env.APP_URL ?? '').replace(/\/$/, '');
const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;
const WAIT_SECONDS = Number(process.env.WAIT_SECONDS ?? 90);
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

// Prices in cents (D-010). Icons from the closed list (D-046, D-047, docs/design/icons.md).
const EUR_DEMO_CATALOG = [
  {
    name: 'Boissons',
    icon: 'beer',
    products: [
      ['Bière pression', 350, 'beer'],
      ['Verre de vin', 300, 'wine'],
      ['Soda', 200, 'soft_drink'],
      ['Eau', 100, 'water'],
      ['Café', 150, 'coffee'],
    ],
  },
  {
    name: 'Restauration',
    icon: 'sandwich',
    products: [
      ['Sandwich', 450, 'sandwich'],
      ['Hot-dog', 350, 'hot_dog'],
      ['Chips', 150, 'snack'],
      ['Part de gâteau', 250, 'cake'],
    ],
  },
  {
    name: 'Consignes',
    icon: 'deposit',
    products: [
      ['Eco-cup', 100, 'deposit'],
      ['Retour eco-cup', -100, 'deposit'],
    ],
  },
];

const fail = (message) => {
  console.error(`::error::${message}`);
  process.exit(1);
};

async function api(method, route, body) {
  const res = await fetch(`${APP_URL}/api${route}`, {
    method,
    headers: { Authorization: AUTH, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// The container was just restarted: its migrations may still be running.
async function waitForApi() {
  for (let i = 0; i < WAIT_SECONDS; i += 1) {
    try {
      return await api('GET', '/categories');
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return fail(`The EUR demo API did not answer within ${WAIT_SECONDS} s.`);
}

// Same source as capture.mjs: the runtime config the client reads before it starts.
async function readCurrency() {
  const res = await fetch(`${APP_URL}/config.js`, { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`GET /config.js -> ${res.status}`);
  return /"VITE_CURRENCY"\s*:\s*"(\w+)"/.exec(await res.text())?.[1] ?? null;
}

async function main() {
  if (!APP_URL || !USER || !PASS)
    fail('APP_URL, BASIC_AUTH_USER and BASIC_AUTH_PASS are required.');

  const categories = await waitForApi();
  const currency = await readCurrency();
  if (currency !== 'EUR')
    fail(`The instance is in ${currency ?? 'an unknown currency'}, not in EUR: nothing created.`);

  const products = await api('GET', '/products');
  if (categories.length > 0 || products.length > 0) {
    console.log(
      `Catalog already there (${categories.length} categories, ${products.length} products): nothing changed.`
    );
    return;
  }

  const created = [];
  try {
    let count = 0;
    for (const category of EUR_DEMO_CATALOG) {
      const { id } = await api('POST', '/categories', { name: category.name, icon: category.icon });
      created.push(id);
      for (const [name, price, icon] of category.products) {
        await api('POST', '/products', { name, price, icon, categoryId: id });
        count += 1;
      }
    }
    console.log(`Demo catalog created: ${created.length} categories, ${count} products.`);
  } catch (error) {
    // Deleting a category deletes its products: back to an empty catalog.
    const leftovers = [];
    for (const id of created) {
      await api('DELETE', `/categories/${id}`).catch(() => leftovers.push(id));
    }
    fail(
      `Demo catalog creation failed (${error.message}).` +
        (leftovers.length
          ? ` Categories not deleted: ${leftovers.join(', ')}, delete them by hand.`
          : ' What was created has been deleted.')
    );
  }
}

await main();
