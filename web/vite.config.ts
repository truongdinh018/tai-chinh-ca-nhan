import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages project site: set VITE_BASE=/tai-chinh-ca-nhan/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        // animal-island-ui Notification imports a React-18-only createRoot shim that
        // crashes on React 19: Cannot set properties of undefined (setting 'usingClientEntryPoint')
        find: /animal-island-ui[\\/]dist[\\/]es[\\/]_virtual[\\/]client\.js$/,
        replacement: path.resolve(root, 'src/shims/animal-island-client.ts'),
      },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
  },
})
