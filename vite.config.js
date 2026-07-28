@'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: './',

  server: {
    host: true,
    port: 5173,
  },

  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
  },
})
'@ | Set-Content -Encoding UTF8 .\vite.config.js