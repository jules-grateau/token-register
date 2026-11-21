import { buildRuntimeConfigScript, getConfiguredClientName } from '../runtimeConfig';

const readScript = (script: string): Record<string, string> => {
  const window: { APP_CONFIG?: Record<string, string> } = {};
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('window', script)(window);
  return window.APP_CONFIG ?? {};
};

const base = {
  apiUrl: 'http://localhost:3001',
  defaultLanguage: 'fr',
  currency: 'EUR' as const,
  clientName: 'Comité des fêtes',
};

describe('getConfiguredClientName (D-040)', () => {
  it('is empty when CLIENT_NAME is not set or blank', () => {
    expect(getConfiguredClientName({})).toBe('');
    expect(getConfiguredClientName({ CLIENT_NAME: '   ' })).toBe('');
  });

  it('trims the configured name', () => {
    expect(getConfiguredClientName({ CLIENT_NAME: '  Club Exemple  ' })).toBe('Club Exemple');
  });
});

describe('buildRuntimeConfigScript', () => {
  it('exposes every runtime value to the client', () => {
    expect(readScript(buildRuntimeConfigScript(base))).toEqual({
      VITE_BASE_API_URL: 'http://localhost:3001',
      VITE_DEFAULT_LANGUAGE: 'fr',
      VITE_CURRENCY: 'EUR',
      VITE_CLIENT_NAME: 'Comité des fêtes',
    });
  });

  it('keeps quotes, backslashes and accents of the client name intact', () => {
    const clientName = `L'amicale "des pompiers" \\ Val-de-Sèvre`;
    expect(readScript(buildRuntimeConfigScript({ ...base, clientName })).VITE_CLIENT_NAME).toBe(
      clientName
    );
  });

  it('cannot be broken out of with a closing script tag', () => {
    const clientName = '</script><script>alert(1)</script>';
    const script = buildRuntimeConfigScript({ ...base, clientName });
    expect(script).not.toContain('</script>');
    expect(readScript(script).VITE_CLIENT_NAME).toBe(clientName);
  });
});
