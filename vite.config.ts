import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['8bbfc8ce-53bf-4b96-9c67-f6c27ba758c7-00-22a5tw645wksd.janeway.replit.dev'],
  },
})
