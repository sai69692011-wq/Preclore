# Preclore v2.3 'Perfection'

Research Facilitator & Matchmaker — credentialing, portfolio hosting, mentorship,
faculty review, and a public research journal. (Not a grant-maker.)

## Deploy in 4 steps

1. **Install deps**
   ```bash
   npm install
   ```

2. **Environment** — copy the example and fill in your Supabase project values
   (also set them in Vercel → Settings → Environment Variables):
   ```bash
   cp .env.local.example .env.local
   ```

3. **Database** — run the single cumulative, idempotent SQL file in the
   Supabase SQL editor:
   ```
   supabase/migration.sql
   ```

4. **Build & run**
   ```bash
   npm run build && npm start
   ```

## Notes

- Next.js 16 + React 19, TypeScript strict, zero webpack config.
- Root alias `@/*` → project root (`app/`, `lib/` live at the top level).
- The platform is 100% free — there is no payment or verification flow.
  Before launch, type YOUR OWN donation UPI handle into `DONATION_UPI` in
  `lib/constants.ts` (/support page; donations carry no preset amount).
- The Shield middleware (age gate, alumni redirect, guest view limit) writes
  `pr_age` / `pr_guest_views` cookies — set `pr_age` at signup.
