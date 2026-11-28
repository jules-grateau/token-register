/**
 * Configuration of the login (D-063). Read once at startup; an invalid value refuses the start
 * with a message naming the variable (D-009).
 */

/**
 * TRUST_PROXY_HOPS (answer 12 a): number of reverse proxies in front of the API whose
 * X-Forwarded-For is trusted, 0 by default (the client IP is the TCP peer). Behind one proxy
 * (Traefik), 1. Never `true`: a client could then pick its own IP and dodge the login limiter.
 */
export function getTrustProxyHops(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.TRUST_PROXY_HOPS?.trim();
  if (!raw) return 0;
  if (!/^\d{1,2}$/.test(raw)) {
    throw new Error(
      `Invalid TRUST_PROXY_HOPS "${raw}": expected the number of reverse proxies in front of ` +
        'the API (0, 1, 2...).'
    );
  }
  return Number(raw);
}

/**
 * Secure flag of the session cookie (point 3): on in production, where the app is served over
 * HTTPS. COOKIE_SECURE=false turns it off, for a local HTTP instance (release QA).
 */
export function isSecureCookie(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'production' && env.COOKIE_SECURE?.trim().toLowerCase() !== 'false';
}

/** Origin allowed to send write requests (answer 11 a): FRONTEND_URL, without a final "/". */
export function getAllowedOrigin(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.FRONTEND_URL?.trim().replace(/\/+$/, '');
  return value ? value : null;
}

export const LEGACY_BASIC_AUTH_WARNING =
  'WARNING: BASIC_AUTH_USER / BASIC_AUTH_PASS are no longer used since 3.0.0 (user accounts ' +
  'and login screen): remove them from the configuration.';

/** BASIC_AUTH_* is no longer read since 3.0.0 (point 2): a warning at startup if still set. */
export function hasLegacyBasicAuth(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BASIC_AUTH_USER || env.BASIC_AUTH_PASS);
}
