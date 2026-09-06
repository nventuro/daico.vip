import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { SUPABASE_URL, YOUTUBE_EMBED_URL } from './src/config';
import { PDF_DECODERS, PDF_DECODERS_URL } from './src/lib/pdfDecoders';

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
  "form-action 'self'",
].join('; ');

/**
 * What the build calls itself: the day the commit was made and its short hash,
 * e.g. "30/08 · 3400c58". Taken from the commit rather than from the clock, so
 * two builds of the same source say the same thing. Outside a checkout there
 * is no answer to give.
 */
function buildVersion(): string {
  try {
    const [hash, date] = execSync('git log -1 --format="%h %cd" --date=format:%d/%m', {
      encoding: 'utf8',
    })
      .trim()
      .split(' ');
    return `${date} · ${hash}`;
  } catch {
    return 'sin versión';
  }
}

/** The pdf.js decoders, copied from the package into the build under the
 *  address the app fetches them from, and served from it in dev. */
function pdfDecoders(): Plugin {
  const require = createRequire(import.meta.url);
  const dir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'wasm');
  return {
    name: 'pdf-decoders',
    generateBundle() {
      for (const name of PDF_DECODERS) {
        this.emitFile({
          type: 'asset',
          fileName: `${PDF_DECODERS_URL.slice(1)}${name}`,
          source: fs.readFileSync(path.join(dir, name)),
        });
      }
    },
    configureServer(server) {
      server.middlewares.use(PDF_DECODERS_URL, (req, res, next) => {
        const name = (req.url ?? '').slice(1);
        if (!PDF_DECODERS.includes(name)) return next();
        res.setHeader('Content-Type', 'application/wasm');
        fs.createReadStream(path.join(dir, name)).pipe(res);
      });
    },
  };
}

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

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(buildVersion()) },
  plugins: [
    react(),
    tailwindcss(),
    // Progressive Web App: precaches the app shell (incl. the SQLite wasm) so the
    // app opens and runs with no connection — required for offline shopping-list
    // use at the store. `prompt` leaves a new build waiting instead of letting it
    // take over a page that is already running the old one, which would leave the
    // two mixed; `src/lib/appUpdate.ts` decides when it goes in, and registers the
    // worker itself, so the plugin injects no script of its own.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
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
        // Precache everything in the build, the SQLite wasm and the pdf.js
        // decoders included.
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
    pdfDecoders(),
  ],
  // SQLocal and the SQLite wasm ship a worker + wasm that must not be pre-bundled
  // by Vite's dep optimizer, or the custom SAH-pool worker fails to resolve its
  // assets. The worker imports `@sqlite.org/sqlite-wasm` directly, so exclude it too.
  optimizeDeps: { exclude: ['sqlocal', '@sqlite.org/sqlite-wasm'] },
  // SQLocal's worker code-splits, which Vite's default IIFE worker format can't
  // bundle — emit ES module workers instead (supported on all modern browsers).
  worker: { format: 'es' },
  build: {
    // pdf.js is the one chunk near Rollup's usual line, and it is loaded on
    // demand: a minor of it must not turn the build red.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // The Supabase client is the one large dependency in the startup bundle;
        // giving it its own chunk keeps the main one comfortably under the size
        // Rollup warns at, and lets the client's cache entry survive app updates.
        // ProseMirror is the bulk of the editor, which only a body loads: in a
        // chunk of its own the editor's stays under that size too, and the
        // part that never changes between builds keeps its cache entry.
        manualChunks: (id) => {
          if (id.includes('node_modules/@supabase/')) return 'supabase';
          if (id.includes('node_modules/prosemirror-') || id.includes('node_modules/@tiptap/pm/'))
            return 'prosemirror';
          return undefined;
        },
      },
    },
  },
  // On this machine only: the dev server carries no policy, and a phone on
  // the same network is let in on purpose with `--host`.
  server: { host: 'localhost' },
});
