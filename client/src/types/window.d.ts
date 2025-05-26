export interface AppConfig {
  VITE_BASE_API_URL?: string;
  VITE_DEFAULT_LANGUAGE?: string;
}

declare global {
  interface Window {
    APP_CONFIG?: AppConfig;
  }
}
export {};
