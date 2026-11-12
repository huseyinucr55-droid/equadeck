import { defineConfig } from '@playwright/test';

// Runs against the local dev server with the installed Chrome (no browser download).
export default defineConfig({
  testDir: './e2e',
  // Four Chrome instances at once starved this machine (first tests timed out
  // at 50 s); two workers with a 60 s budget is reliable.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
  // One retry. Under heavy load Chrome occasionally cancels a download even on
  // a bare page with no app code (BUG-007 control test, 1 of 18), so a single
  // failure there is the environment, not the app. Retried passes are reported
  // as "flaky", not hidden; a test that fails twice still fails the run.
  retries: 1,
  reporter: [['list']],
  use: {
    // The production build (vite preview): bundled like real users get it, and
    // fast enough for parallel workers. The unbundled dev server timed out at 4.
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
