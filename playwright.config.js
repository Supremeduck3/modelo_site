import { defineConfig } from '@playwright/test';

/**
 * E2E dos fluxos críticos. Roda contra o build de produção, que é o que a
 * implantação realmente serve.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3210',
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx next start -p 3210',
        url: 'http://localhost:3210/manifestacao',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
