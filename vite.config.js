import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express server during development so the
    // frontend can use same-origin '/api/...' paths with no CORS setup.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
