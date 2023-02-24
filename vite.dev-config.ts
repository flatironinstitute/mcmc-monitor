import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "https://flatironinstitute.github.io/mcmc-monitor/dev",
  build: {
    outDir: "dev-dist"
  },
  resolve: {
    alias: {
      "simple-peer": "simple-peer/simplepeer.min.js"
    }
  }
})
