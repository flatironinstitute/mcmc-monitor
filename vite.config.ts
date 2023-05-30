import react from '@vitejs/plugin-react'
import { configDefaults, coverageConfigDefaults, defineConfig } from 'vitest/config'
// import { VitePluginRadar } from 'vite-plugin-radar'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    mockReset: true,
    coverage: {
        all: true,
        enabled: true,
        exclude: [
            ...coverageConfigDefaults.exclude,
            "**/*Types.ts",
            "index.ts",
            "service/*",
            "dev-dist/*",
            "vite*ts"
        ],
        provider: "c8",
        reporter: ['text', 'lcov']
    },
    exclude: [...configDefaults.exclude, "service/**"],
    environment: 'jsdom'
  },
  plugins: [
    react(),
    // VitePluginRadar({
    //     analytics: [{
    //         id: 'G-33SWX083FG'
    //     }]
    // })
],
  base: "https://flatironinstitute.github.io/mcmc-monitor",
  resolve: {
    alias: {
      "simple-peer": "simple-peer/simplepeer.min.js"
    }
  }
})
// note for test: mockReset clears all spies/mocks and resets to empty function,
// while restoreMocks: true calls .mockRestore() thereby clearing spies & mock
// history and resets implementations to original implementation.
// consider logHeapUsage flag/key to diagnose memory leaks.