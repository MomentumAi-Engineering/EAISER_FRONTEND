import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Faster than terser
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          map: ['leaflet', 'react-leaflet'], // Optimizes map loading
        }
      }
    }
  }
})
