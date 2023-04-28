import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        mockReset: true,
        coverage: {
            all: true,
            enabled: true,
            exclude: [
                ...coverageConfigDefaults.exclude,
                "**/*Types.ts",
                "**/index.ts",
                "vite*ts"
            ],
            provider: "c8",
            reporter: ["text", "lcov"],
        }
    }
})