# Preclore v2.4 — Minimalist “Public Good” Registry

A Next.js + Supabase rebuild of Preclore as a game-like student research registry.

## What this repo includes

- **Game UI:** Warm academic pastels, tactile 3D buttons, shimmering progress bars, animated tier badges.
- **8-step Quest:** Submission flow for instant publishing.
- **Deterministic VQ Engine:** Pure JavaScript, no randomness, no human review.
- **Global Research Journal:** Searchable cream-paper archive of published projects.
- **Project Type Tags:**
  - Academic Theory
  - Field Verified
  - Project: Needs Funding
  - Idea Only
- **Support Architecture:**
  - `/support` for voluntary mission donations via manual UPI / PhonePe flow.
  - Project-level **Support this Researcher** card for accepted mentor/admin access only.
- **Supabase RLS:** Parent UPI IDs are protected until a mentor/admin access request is accepted.
- **Registry-only logic:** No platform-managed sponsorship disbursements or mandatory pricing flows.
- **Age Gate:** Users above 20 are redirected to read-only portfolio mode and blocked from submission routes.

## Stack

- Next.js 16.2.12 (App Router)
- React 19
- Supabase Auth + Postgres + RLS
- Tailwind utilities + custom CSS

## Setup

1. Copy `.env.example` to `.env.local`
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_MISSION_UPI_ID`
   - `NEXT_PUBLIC_MISSION_PAYEE_NAME`
3. Run the SQL migration in Supabase SQL Editor:
   - `supabase/migrations/20260726_preclore_v24_public_good_registry.sql`
4. Install and run:

```bash
npm install
npm run dev
```

## Review commands

```bash
npm run review:vq
npm run review:arch
npm run review
```

## Direct GitHub → Vercel push

1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables in Vercel.
4. Deploy.

## Suggested Supabase auth settings

- Enable Email OTP / Magic Link auth.
- Add redirect URL:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.vercel.app/auth/callback`

## Notes on RLS and support routing

- Public project discovery now flows through sanitized SQL RPCs instead of broad public table reads.
- `users.parent_upi_id` is self-readable only; mentor/admin access is mediated by accepted requests and `get_connected_parent_upi(uuid)`.
- Public identities no longer derive from email local-parts.
- Preclore never receives or disburses researcher support money.

## Compatibility `/src` helpers

To support teams expecting a `/src` layout, the repo also includes:

```text
src/lib/constants.ts
src/lib/design-tokens.ts
src/lib/review-pipeline.ts
src/lib/video-metadata.ts
src/app/mentorship/actions.ts
```

## Repo tree

```text
app/
  api/
  auth/
  connections/
  journal/
  profile/
  project/[slug]/
  project/new/
  reveal/[id]/
  submit/
  support/
components/
lib/
src/
supabase/migrations/
tests/
```
