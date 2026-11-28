import {
  getAllowedOrigin,
  getTrustProxyHops,
  hasLegacyBasicAuth,
  isSecureCookie,
} from '../authConfig';

describe('login configuration (D-063)', () => {
  it('trusts no proxy by default, and the number given by TRUST_PROXY_HOPS (answer 12 a)', () => {
    expect(getTrustProxyHops({})).toBe(0);
    expect(getTrustProxyHops({ TRUST_PROXY_HOPS: ' 1 ' })).toBe(1);
    for (const value of ['true', '-1', '1.5', 'abc', '100']) {
      expect(() => getTrustProxyHops({ TRUST_PROXY_HOPS: value })).toThrow('TRUST_PROXY_HOPS');
    }
  });

  it('marks the cookie Secure in production, unless COOKIE_SECURE=false', () => {
    expect(isSecureCookie({ NODE_ENV: 'production' })).toBe(true);
    expect(isSecureCookie({ NODE_ENV: 'production', COOKIE_SECURE: 'false' })).toBe(false);
    expect(isSecureCookie({ NODE_ENV: 'development' })).toBe(false);
  });

  it('reads the allowed origin from FRONTEND_URL, without a final slash', () => {
    expect(getAllowedOrigin({ FRONTEND_URL: 'https://caisse.example/' })).toBe(
      'https://caisse.example'
    );
    expect(getAllowedOrigin({})).toBeNull();
  });

  it('detects a leftover BASIC_AUTH_* configuration', () => {
    expect(hasLegacyBasicAuth({})).toBe(false);
    expect(hasLegacyBasicAuth({ BASIC_AUTH_USER: 'x' })).toBe(true);
  });
});
