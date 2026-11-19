import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The root package.json is the single source of truth for the app version.
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as { version: string };

// CI passes GIT_SHA and RELEASE_CHANNEL (Docker build args). Locally, fall back to git
// (absent from the Docker build context) and to the "development" channel.
function resolveCommit(): string {
  if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(resolveCommit()),
    __APP_CHANNEL__: JSON.stringify(process.env.RELEASE_CHANNEL ?? 'development'),
    // Local/dev currency (client/.env). In Docker, /config.js provides it at runtime.
    __APP_CURRENCY__: JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_').VITE_CURRENCY ?? ''),
  },
}));
