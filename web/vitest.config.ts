import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

// Tests live next to the code as *.test.ts(x). Nothing imports them, so they never reach the
// production bundle. jsdom by default; files that need WebCrypto opt into `node` per file.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      pool: 'vmThreads',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test/setup.ts'],
      restoreMocks: true,
      unstubGlobals: true,
    },
  }),
)
