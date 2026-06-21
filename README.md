# Daico

A private household app — track chores, appointments, and personal documents. All
data is sensitive and strictly gated behind Google sign-in: only allowlisted
accounts can see or change anything.

## Stack

React + TypeScript + Vite · Tailwind CSS v4 · Supabase (Postgres + Google OAuth) ·
GitHub Pages.

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