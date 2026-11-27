/* global process, fetch, console, setTimeout */
// Demo catalog of the EUR demo instance (D-059), run by ci-cd.yml after each demo deploy.
// Lives outside the app on purpose: a new database starts empty and the app itself never
// creates a catalog (D-055). This script only talks to the API of a running instance, and:
//   - fills the catalog only when the instance has no category and no product at all;
//   - never modifies, nor deletes, anything that already exists (a second run does nothing);
//   - refuses an instance that is not in euros (wrong URL in the secrets): it exits 1.
// A creation failing half-way deletes what this run created, so that the next run starts
// again from an empty catalog, then exits 1.
//
// Env: APP_URL, LOGIN_USER, LOGIN_PASS (an account of the instance, D-063: on the EUR demo,
//      its dedicated cashier account; logged in through POST /api/auth/login, session cookie),
//      WAIT_SECONDS (optional, default 90: how long to wait for the API after a restart).
// Never prints the URL nor the host: they are secrets, and the Actions logs are public.

const APP_URL = (process.env.APP_URL ?? '').replace(/\/$/, '');
const USER = process.env.LOGIN_USER;
const PASS = process.env.LOGIN_PASS;
const WAIT_SECONDS = Number(process.env.WAIT_SECONDS ?? 90);
// Session cookie ("cc_session=..."), set by logIn(). Never printed.
let SESSION = '';

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
    headers: { Cookie: SESSION, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status}`);
  return res.status === 204 ? null : res.json();
}

class LoginRefused extends Error {}

// Opens a session. Wrong credentials (401) or the wait after 5 failures (429): stop at once,
// retrying would only extend the wait.
async function logIn() {
  const res = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  if (res.status === 401 || res.status === 429) {
    throw new LoginRefused(`Login refused (${res.status}): check LOGIN_USER / LOGIN_PASS.`);
  }
  if (!res.ok) throw new Error(`POST /auth/login -> ${res.status}`);
  SESSION =
    res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .find((c) => c.startsWith('cc_session=')) ?? '';
  if (!SESSION) throw new Error('POST /auth/login: no session cookie');
}

// The container was just restarted: its migrations may still be running.
async function waitForApi() {
  for (let i = 0; i < WAIT_SECONDS; i += 1) {
    try {
      await logIn();
      return await api('GET', '/categories');
    } catch (error) {
      if (error instanceof LoginRefused) return fail(error.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return fail(`The EUR demo API did not answer within ${WAIT_SECONDS} s.`);
}

// Same source as capture.mjs: the runtime config the client reads before it starts (public).
async function readCurrency() {
  const res = await fetch(`${APP_URL}/config.js`);
  if (!res.ok) throw new Error(`GET /config.js -> ${res.status}`);
  return /"VITE_CURRENCY"\s*:\s*"(\w+)"/.exec(await res.text())?.[1] ?? null;
}

async function main() {
  if (!APP_URL || !USER || !PASS) fail('APP_URL, LOGIN_USER and LOGIN_PASS are required.');

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

// Any other error (network, unexpected answer): only its message, never its cause nor its
// stack, which can hold the host name (e.g. "getaddrinfo ENOTFOUND <host>") (TL-1, PR #73).
try {
  await main();
  // Closes the session opened for this run.
  await api('POST', '/auth/logout').catch(() => {});
} catch (error) {
  fail(`EUR demo catalog: ${error instanceof Error ? error.message : 'unexpected error'}.`);
}
