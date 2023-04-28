import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    mockReset: true,
    coverage: {
        enabled: true,
        provider: "c8",
        reporter: ['text', 'lcov']
    },
    exclude: [...configDefaults.exclude, "service/**"]
  },
  plugins: [react()],
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