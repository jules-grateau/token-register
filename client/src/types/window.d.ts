// src/global.d.ts (or src/types/window.d.ts, etc.)

interface AppConfig {
  VITE_BASE_API_URL?: string; // Mark as optional if it might not always be present
  VITE_DEFAULT_LANGUAGE?: string;
  // Add other properties you expect in APP_CONFIG
}

declare global {
  interface Window {
    APP_CONFIG?: AppConfig; // Add your custom property here
  }
}

// You need this export {} to make it a module,
// which is often required for global augmentations to be picked up correctly.
export {};