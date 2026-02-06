import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  ],
  server: {
    host: true,
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
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios', 'jwt-decode'],
          ui: ['framer-motion', 'lucide-react', 'react-hot-toast'],
          charts: ['apexcharts', 'react-apexcharts', 'chart.js', 'react-chartjs-2', 'recharts'],
          maps: ['@react-google-maps/api', 'leaflet', 'react-leaflet', 'geolib'],
          media: ['browser-image-compression', 'heic2any', 'canvas-confetti'],
        }
      }
    }
  }
})
// Force restart
