import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        mockReset: true,
        coverage: {
            enabled: true,
            provider: "c8",
            reporter: ["text", "lcov"]
        }
    }
})