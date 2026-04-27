import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // If you host under a subpath behind a reverse proxy, set BASE_PATH.
  // Example: BASE_PATH=/mcu/ npm run build
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
