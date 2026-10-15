import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  reporter: [['list']],
  webServer: {
    command: 'node tests/helpers/serve.mjs',
    port: 4173,
    reuseExistingServer: true,
  },
})
