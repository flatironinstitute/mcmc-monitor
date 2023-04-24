import { defineConfig, mergeConfig } from 'vite'
import viteConfig from './vite.config'

// https://vitejs.dev/config/
export default mergeConfig(viteConfig, defineConfig({
  base: "https://flatironinstitute.github.io/mcmc-monitor/dev",
  build: {
    outDir: "dev-dist"
  },
}))
