import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts on purpose: the app config loads the PWA and
// SQLocal-worker plugins, none of which the (pure, node-only) unit tests need.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
