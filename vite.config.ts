import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { SUPABASE_URL } from './src/config';
import { YOUTUBE_EMBED_URL } from './src/types';

// The page's Content-Security-Policy, carried as a <meta> tag because the static
// host can't set response headers. The point is `script-src`: no inline and no
// third-party script can run, and a script can't send anything anywhere but
// Supabase. `'wasm-unsafe-eval'` lets SQLite compile its wasm; `'unsafe-inline'`
// on styles covers the inline `style` attributes React sets, which is not an
// exfiltration path worth fighting. Injected at build only: the dev server
// needs an inline script (Fast Refresh) and a websocket the policy would deny.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self'",
  `connect-src 'self' ${SUPABASE_URL}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  `frame-src ${new URL(YOUTUBE_EMBED_URL).origin}`,
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        // Before every other tag in <head>: a policy governs only what loads after it.
        injectTo: 'head-prepend',
      },
    ],
  };
}

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
        name: 'daico',
        short_name: 'daico',
        description: 'Organización del hogar.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ede6d6',
        theme_color: '#ede6d6',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
    contentSecurityPolicy(),
  ],
  // SQLocal and the SQLite wasm ship a worker + wasm that must not be pre-bundled
  // by Vite's dep optimizer, or the custom SAH-pool worker fails to resolve its
  // assets. The worker imports `@sqlite.org/sqlite-wasm` directly, so exclude it too.
  optimizeDeps: { exclude: ['sqlocal', '@sqlite.org/sqlite-wasm'] },
  // SQLocal's worker code-splits, which Vite's default IIFE worker format can't
  // bundle — emit ES module workers instead (supported on all modern browsers).
  worker: { format: 'es' },
  build: {
    rollupOptions: {
      output: {
        // The Supabase client is the one large dependency in the startup bundle;
        // giving it its own chunk keeps the main one comfortably under the size
        // Rollup warns at, and lets the client's cache entry survive app updates.
        manualChunks: { supabase: ['@supabase/supabase-js'] },
      },
    },
  },
  server: {
    host: '0.0.0.0',
  },
});
