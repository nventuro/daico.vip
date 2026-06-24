import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Progressive Web App: precaches the app shell (incl. the SQLite wasm) so the
    // app opens and runs with no connection — required for offline shopping-list
    // use at the store. `autoUpdate` ships new versions silently on next load.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon-32.png', 'favicon-48.png', 'favicon-180.png'],
      manifest: {
        name: 'Daico',
        short_name: 'Daico',
        description: 'Organización del hogar.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#faf9f7',
        theme_color: '#0d9488',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything in the build, including the ~1.5 MB SQLite wasm.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Cache the Google Fonts stylesheet + font files so type renders offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  // SQLocal ships a worker + wasm that must not be pre-bundled by Vite's dep
  // optimizer, or the worker fails to resolve its assets.
  optimizeDeps: { exclude: ['sqlocal'] },
  // SQLocal's worker code-splits, which Vite's default IIFE worker format can't
  // bundle — emit ES module workers instead (supported on all modern browsers).
  worker: { format: 'es' },
  server: {
    host: '0.0.0.0',
  },
})
