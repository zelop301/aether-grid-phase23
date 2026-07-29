import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Local development stays at localhost:5173/
  // GitHub Pages uses the repository subdirectory.
  base: command === 'build' ? '/aether-grid-phase23/' : '/',

  server: {
    host: true,
    port: 5173,
  },

  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600,
  },
}))