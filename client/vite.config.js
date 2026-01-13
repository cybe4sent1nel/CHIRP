import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Unified Vite config with a development proxy to avoid CORS during local
// development. Proxies any request starting with /api to the backend defined
// by VITE_API_URL (or defaults to http://localhost:4000).
const API_TARGET = process.env.VITE_API_URL || 'http://localhost:4000'

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false
      }
    }
  }
}))
