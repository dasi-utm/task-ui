import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_URL = process.env.TASK_API_URL ?? 'http://localhost:3001'
const ANALYTICS_URL = process.env.TASK_ANALYTICS_URL ?? 'http://localhost:3003'
const PROCESSING_URL = process.env.TASK_PROCESSING_URL ?? 'http://localhost:3002'

console.log("API_URL: ", API_URL)
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: API_URL, changeOrigin: true },
      '/hubs': { target: API_URL, changeOrigin: true, ws: true },
      '/analytics': {
        target: ANALYTICS_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/analytics/, '/api/analytics'),
      },
      '/processing': { target: PROCESSING_URL, changeOrigin: true },
    },
  },
})
