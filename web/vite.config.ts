import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const root = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages project site: set VITE_BASE=/tai-chinh-ca-nhan/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'sql-wasm.wasm', 'py/**/*', 'samples/**/*'],
      manifest: {
        name: 'Tài chính cá nhân',
        short_name: 'Tài chính',
        description: 'Sổ thu chi cá nhân — chạy hoàn toàn trên trình duyệt, không cần đăng nhập.',
        lang: 'vi',
        theme_color: '#2d8c8c',
        background_color: '#dff5ef',
        display: 'standalone',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,py,json,csv}'],
        maximumFileSizeToCacheInBytes: 4_000_000,
        navigateFallbackDenylist: [/^\/py\//],
      },
    }),
  ],
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
