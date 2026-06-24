# Daico

A private household app — track chores, appointments, and personal documents. All
data is sensitive and strictly gated behind Google sign-in: only allowlisted
accounts can see or change anything.

## Stack

React + TypeScript + Vite · Tailwind CSS v4 · Supabase (Postgres + Google OAuth) ·
GitHub Pages.

## Offline-first

Chores and the shopping list work with **no connection** — you can open the app,
add, check off, and delete items offline (e.g. at a shop with no signal), and it
all syncs automatically once you're back online. There's no spinner on any
action: the UI reads and writes a local database and the network happens in the
background.

Three pieces make this work:

- **PWA / service worker** (`vite-plugin-pwa`). The first online visit precaches
  the app shell — including the ~1.5 MB SQLite WebAssembly — so the app *opens and
  runs* with no network. Installable ("Add to Home Screen") for a fullscreen,
  app-like launch. GitHub Pages serves it over HTTPS, which service workers
  require; no custom headers are needed (see the SQLite note below).

- **Local SQLite** (`src/lib/offline/`). [SQLocal](https://sqlocal.dev) runs SQLite
  in a Web Worker, persisted to the browser's [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system).
  It uses the **OPFS SAH Pool VFS**, which (unlike the default OPFS VFS) needs no
  `SharedArrayBuffer` and therefore no `COOP`/`COEP` response headers — important
  because **GitHub Pages can't set custom headers**. `engine.ts` is the source of
  truth the UI reads/writes; every change is instant and offline-safe.

- **Sync engine** (`src/lib/offline/sync.ts`). On load, on reconnect, and on app
  focus it pushes queued local changes and pulls the server state. Conflicts use
  **last-write-wins** by an `updated_at` timestamp set at edit time; deletes win
  over a concurrent edit. Each row carries a client-generated UUID so an
  offline-created row has a stable identity before it ever reaches the server.

The membership check is also offline-tolerant: it falls back to the last-known
verdict cached per user, so a member isn't locked out with no signal. This is only
a UI gate — the server's RLS is still the real authority (see `CLAUDE.md`).

### Adding another offline table

1. Migration: create the table with a `uuid` primary key (client-supplied) and an
   `updated_at` timestamp, plus the usual RLS + `private.is_member()` policy +
   `authenticated` grants. **No `updated_at` trigger** — the client owns it for
   last-write-wins.
2. Add a `TableSpec` to `src/lib/offline/specs.ts` (and to `ALL_SPECS`).
3. Add a thin typed hook (see `useShoppingList` / `useChores`) over
   `useOfflineTable`. No new sync code needed.

### Caveats

- **Last-write-wins** is per-row by client clock. Fine for 1–2 users; clock skew
  could in theory misorder near-simultaneous edits on different devices. Deletes
  are unconditional ("delete wins"), so deleting an item another device just
  edited removes it.
- **OPFS** needs a modern browser (Chrome/Android, or iOS Safari ≥ 16.4).
- Local data is wiped on sign-out (shared-device hygiene).

## Local development

```bash
npm install
npm run dev
```

The app won't authenticate until you wire up a Supabase project (below).

## First-time setup

### 1. Create the Supabase project

- Create a project at [supabase.com](https://supabase.com).
- Copy the project URL and the **publishable** key (`sb_publishable_...`) from
  Project Settings → API Keys into `src/config.ts`. (The legacy anon JWT key still
  works but is deprecated — use the publishable key.)
- Create a `.env` (gitignored) with:
  ```
  SUPABASE_PROJECT_REF=your-project-ref
  SUPABASE_DB_PASSWORD=your-db-password
  ```

### 2. Configure Google OAuth

- In the [Google Cloud Console](https://console.cloud.google.com): set up an OAuth
  consent screen and create OAuth client credentials (Web application).
- Add the Supabase callback URL as an authorized redirect URI:
  `https://<project-ref>.supabase.co/auth/v1/callback`.
- In the Supabase dashboard → Authentication → Providers → Google: enable it and
  paste the client ID and secret.
- In Authentication → URL Configuration: set the Site URL to the production URL
  and add `http://localhost:5173` as an additional redirect URL for local dev.

### 3. Push the schema

```bash
npm run db:link   # once
npm run db:push
```

Then add the authorized Google account emails to the `members` table via the
Supabase SQL editor — only those accounts can access
the app. Until a member exists, the app denies everyone.

### 4. Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys
to GitHub Pages.