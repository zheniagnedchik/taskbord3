import { defineConfig, devices } from '@playwright/test'

/** Milliseconds between Playwright operations; set via `E2E_SLOW_MO=300 npm run test:e2e:ui` to watch runs more easily */
const slowMoRaw = Number(process.env.E2E_SLOW_MO)
const launchOptions =
  process.env.E2E_SLOW_MO !== undefined && Number.isFinite(slowMoRaw) && slowMoRaw >= 0
    ? { slowMo: slowMoRaw }
    : {}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    // Sidebar with boards uses `lg:` (min-width 1024px).
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    ...(Object.keys(launchOptions).length > 0 ? { launchOptions } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_SKIP_SERVE
    ? undefined
    : {
        command: 'npm run dev',
        url: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
