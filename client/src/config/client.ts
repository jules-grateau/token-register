import { APP_NAME } from './version';

// D-040: the client (association) name is set by the instance configuration, never in the app.
// Runtime value (/config.js, from the API's CLIENT_NAME env var) wins over the build-time one
// (VITE_CLIENT_NAME, injected by vite.config.ts). The `typeof` guard keeps this usable in Jest.

/** Trimmed name, or undefined when it is missing or blank. */
export function parseClientName(value: string | undefined): string | undefined {
  const name = value?.trim();
  return name ? name : undefined;
}

export function getClientName(): string | undefined {
  const runtime = typeof window !== 'undefined' ? window.APP_CONFIG?.VITE_CLIENT_NAME : undefined;
  const buildTime = typeof __APP_CLIENT_NAME__ !== 'undefined' ? __APP_CLIENT_NAME__ : undefined;
  return parseClientName(runtime) ?? parseClientName(buildTime);
}

/** Browser tab title (D-040): "Asso · Caisse Claire", or "Caisse Claire" without a name. */
export function buildDocumentTitle(clientName: string | undefined): string {
  return clientName ? `${clientName} · ${APP_NAME}` : APP_NAME;
}
