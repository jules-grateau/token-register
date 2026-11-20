import type { CurrencyCode } from 'shared-ts';

export interface RuntimeClientConfig {
  apiUrl: string;
  defaultLanguage: string;
  currency: CurrencyCode;
  /** Client (association) name shown in the header (D-040). Empty when not configured. */
  clientName: string;
}

/** Client name configured for this instance (D-040): `CLIENT_NAME` env var, trimmed. */
export function getConfiguredClientName(env: NodeJS.ProcessEnv = process.env): string {
  return env.CLIENT_NAME?.trim() ?? '';
}

/**
 * Body of `/config.js`, read by the client before it starts (window.APP_CONFIG).
 * Values are serialized with JSON.stringify, and `<` is escaped, so that a quote, a backslash
 * or a `</script>` in a configured value (e.g. the client name) can never break the script.
 */
export function buildRuntimeConfigScript(config: RuntimeClientConfig): string {
  const appConfig = {
    VITE_BASE_API_URL: config.apiUrl,
    VITE_DEFAULT_LANGUAGE: config.defaultLanguage,
    VITE_CURRENCY: config.currency,
    VITE_CLIENT_NAME: config.clientName,
  };
  const json = JSON.stringify(appConfig).replace(/</g, '\\u003c');
  return `window.APP_CONFIG = ${json};\n`;
}
