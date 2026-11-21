import { buildDocumentTitle, getClientName, parseClientName } from '../client';

describe('parseClientName (D-040)', () => {
  it('trims the name', () => {
    expect(parseClientName('  Club Exemple ')).toBe('Club Exemple');
  });

  it('treats a missing or blank name as not configured', () => {
    expect(parseClientName(undefined)).toBeUndefined();
    expect(parseClientName('')).toBeUndefined();
    expect(parseClientName('   ')).toBeUndefined();
  });
});

describe('getClientName', () => {
  afterEach(() => {
    window.APP_CONFIG = undefined;
  });

  it('reads the runtime configuration (/config.js)', () => {
    window.APP_CONFIG = { VITE_CLIENT_NAME: 'Comité des fêtes' };
    expect(getClientName()).toBe('Comité des fêtes');
  });

  it('is undefined without configuration (Jest: no build-time value)', () => {
    expect(getClientName()).toBeUndefined();
    window.APP_CONFIG = { VITE_CLIENT_NAME: ' ' };
    expect(getClientName()).toBeUndefined();
  });
});

describe('buildDocumentTitle (D-040)', () => {
  it('puts the client name before the app name', () => {
    expect(buildDocumentTitle('Club Exemple')).toBe('Club Exemple · Caisse Claire');
  });

  it('shows the app name alone without a client name', () => {
    expect(buildDocumentTitle(undefined)).toBe('Caisse Claire');
  });
});
