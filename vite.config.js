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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'zustand'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})
