import type { CurrencyCode } from 'shared-ts';

// D-008: the currency is set by the instance configuration, never in the app.
// Runtime value (/config.js, from the API's CURRENCY env var) wins over the build-time one
// (VITE_CURRENCY, injected by vite.config.ts). The `typeof` guard keeps this usable in Jest.

export function parseCurrency(value: string | undefined): CurrencyCode {
  return value?.trim().toUpperCase() === 'EUR' ? 'EUR' : 'TOKEN';
}

export function getCurrency(): CurrencyCode {
  const runtime = typeof window !== 'undefined' ? window.APP_CONFIG?.VITE_CURRENCY : undefined;
  const buildTime = typeof __APP_CURRENCY__ !== 'undefined' ? __APP_CURRENCY__ : undefined;
  return parseCurrency(runtime || buildTime);
}
