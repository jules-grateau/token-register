import type { AppConfig } from '../types/window';
const BUILD_TIME_API_URL = import.meta.env.VITE_BASE_API_URL as string | undefined;
const BUILD_TIME_DEFAULT_LANG = import.meta.env.VITE_DEFAULT_LANGUAGE as string | undefined;

const AppConfig: AppConfig = {
  VITE_BASE_API_URL: BUILD_TIME_API_URL,
  VITE_DEFAULT_LANGUAGE: BUILD_TIME_DEFAULT_LANG,
};

if (window.APP_CONFIG && typeof window.APP_CONFIG === 'object') {
  console.log('Runtime config found (window.APP_CONFIG):', window.APP_CONFIG);
  if (typeof window.APP_CONFIG.VITE_BASE_API_URL === 'string') {
    AppConfig.VITE_BASE_API_URL = window.APP_CONFIG.VITE_BASE_API_URL;
  }
  if (typeof window.APP_CONFIG.VITE_DEFAULT_LANGUAGE === 'string') {
    AppConfig.VITE_DEFAULT_LANGUAGE = window.APP_CONFIG.VITE_DEFAULT_LANGUAGE;
  }
  console.log('Effective AppConfig after merging runtime config:', AppConfig);
} else {
  console.warn(
    'Runtime config (window.APP_CONFIG) not found or not an object. Using build-time fallbacks.'
  );
  console.log('Effective AppConfig (build-time only):', AppConfig);
}

export const BASE_API_URL = AppConfig.VITE_BASE_API_URL;
export const DEFAULT_LANGUAGE = AppConfig.VITE_DEFAULT_LANGUAGE;
