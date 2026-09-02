// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Playwright config for the lenora smoke / regression suite.
 *
 * The game is a dependency-free vanilla-JS canvas app served from `index.html`.
 * All "rough" engines are exercised here headlessly; WebGL falls back to
 * SwiftShader when no GPU is present (typical on CI).
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    viewport: { width: 800, height: 600 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'node scripts/server.js',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
