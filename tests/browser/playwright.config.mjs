import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baseURL = 'http://127.0.0.1:4173';
export default defineConfig({
  testDir: '.',
  workers: 1,
  reporter: 'list',
  use: { baseURL, browserName: 'chromium', headless: true },
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: 'node_modules/.bin/vite preview --host 127.0.0.1 --port 4173 --outDir dist/id-scanner',
    url: baseURL,
    reuseExistingServer: false,
  },
});
