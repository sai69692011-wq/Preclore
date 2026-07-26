# Preclore v2.4 Red Team Audit

Audit date: 2026-07-26

Scope audited:
- `app/**`
- `components/**`
- `lib/**`
- `supabase/migrations/20260726_preclore_v24_public_good_registry.sql`
- `package.json`

## Quick pass/fail summary

### Passed checks
- No `₹199`, `₹99`, or `City League Entry fees` strings were found.
- No broken imports to `design-tokens.ts`, `review-pipeline.ts`, or `video-metadata.ts` were found.
- Researcher-support routing currently uses `parent_upi_id` from the researcher record, not the mission UPI account.
- Empty strings / zero evidence do not produce `NaN` in the current VQ engine.

### Failed / risky checks
- Critical dependency vulnerabilities exist in `next@16.0.0`.
- Auth callback has an open-redirect flaw.
- Public identity defaults leak student email local-parts.
- No age gate / alumni read-only enforcement exists.
- Public `projects` RLS exposes all columns, including `researcher_id` and raw `quest_answers`.
- The VQ engine does not implement the requested `1.1x Academic Multiplier` or `0.5x AI Penalty`.
- `scoreProject(undefined|null)` crashes.
- API routes do not defend against malformed JSON objects or server-side confirmation bypass.
- UPI access is based on any accepted requester; there is no mentor-role guard.
- Commercial/grant language still appears in some UI copy and SQL comments.
- The repo does not match the requested `/src` layout and the expected files are absent.

---

## CRITICAL

### 1) Vulnerable framework version: `next@16.0.0`
**Where:** `package.json`

**Why it matters:**
`npm audit` reports a **critical RCE** plus multiple **high** vulnerabilities affecting the installed Next.js line, including proxy/middleware bypasses and SSRF/DoS classes.

**Immediate correction code block**
```json
{
  "dependencies": {
    "next": "16.2.12"
  }
}
```

Then run:
```bash
npm install
npm audit --omit=dev
npm run build
```

---

## HIGH

### 2) Open redirect in auth callback
**Where:** `app/auth/callback/route.js`

**Problem:**
```js
const redirectTo = requestUrl.searchParams.get('next') || '/profile';
return NextResponse.redirect(new URL(redirectTo, request.url));
```
An attacker can supply `?next=https://evil.example` and bounce users off your trusted auth flow.

**Immediate correction code block**
```js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeRedirectPath(value) {
  if (!value || typeof value !== 'string') return '/profile';
  if (!value.startsWith('/')) return '/profile';
  if (value.startsWith('//')) return '/profile';
  return value;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = safeRedirectPath(requestUrl.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const safeHandle = `researcher-${user.id.slice(0, 8)}`;
      await supabase.from('users').upsert({
        id: user.id,
        display_name: null,
        username: safeHandle,
        created_at: new Date().toISOString()
      });
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
```

---

### 3) Student email local-part leakage into public identity
**Where:**
- `app/auth/callback/route.js`
- `app/api/projects/route.js`
- `app/api/mentorship-requests/route.js`

**Problem:**
The code derives public names from `user.email?.split('@')[0]`. That leaks student identifiers into public project pages and request records.

**Immediate correction code block**
```js
// app/api/projects/route.js
const publicName = profile?.display_name?.trim();
if (!publicName) {
  return NextResponse.json(
    { error: 'Complete your profile with a public display name before publishing.' },
    { status: 400 }
  );
}

const payload = {
  researcher_id: user.id,
  researcher_name: publicName,
  researcher_school: profile?.school_name || null,
  // ...rest
};
```

```js
// app/api/mentorship-requests/route.js
const requesterName = requesterProfile?.display_name?.trim() || `researcher-${user.id.slice(0, 8)}`;

const { data: researcherProfile } = await supabase
  .from('users')
  .select('display_name')
  .eq('id', body.researcherId)
  .maybeSingle();

const payload = {
  requester_id: user.id,
  requester_name: requesterName,
  researcher_id: body.researcherId,
  researcher_name: researcherProfile?.display_name?.trim() || 'Researcher',
  status: 'pending'
};
```

---

### 4) No age gate or alumni read-only enforcement
**Where:**
- `proxy.js`
- `app/submit/page.jsx`
- `app/api/projects/route.js`

**Problem:**
The code has **no age field**, **no alumni state**, and **no server-side block** on submission routes. Any authenticated adult can access `/submit` and publish via `/api/projects`.

**Immediate correction code block (SQL)**
```sql
alter table public.users
  add column if not exists birth_year int,
  add column if not exists account_mode text not null default 'student'
    check (account_mode in ('student', 'alumni_readonly', 'mentor', 'admin'));
```

**Immediate correction code block (proxy)**
```js
// proxy.js
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request) {
  const response = await updateSession(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return response;

  const { data: profile } = await supabase
    .from('users')
    .select('account_mode')
    .eq('id', user.id)
    .maybeSingle();

  const pathname = request.nextUrl.pathname;
  const submissionPaths = ['/submit', '/api/projects', '/project/new'];

  if (profile?.account_mode === 'alumni_readonly' && submissionPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/journal', request.url));
  }

  return response;
}
```

**Immediate correction code block (server-side API enforcement)**
```js
const { data: account } = await supabase
  .from('users')
  .select('account_mode')
  .eq('id', user.id)
  .maybeSingle();

if (account?.account_mode === 'alumni_readonly') {
  return NextResponse.json(
    { error: 'Read-only alumni accounts cannot publish new submissions.' },
    { status: 403 }
  );
}
```

---

### 5) Public `projects` policy exposes all columns, not just safe public fields
**Where:** `supabase/migrations/20260726_preclore_v24_public_good_registry.sql`

**Problem:**
This policy makes **all columns** readable to anyone with the public key if `status='published'`:
```sql
create policy "Public can read published projects"
on public.projects
for select
using (status = 'published');
```
That includes `researcher_id`, `quest_answers`, and any future sensitive/internal columns.

**Immediate correction code block (SQL)**
```sql
drop policy if exists "Public can read published projects" on public.projects;

create or replace function public.get_public_project_cards()
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  researcher_name text,
  region_label text,
  project_tag text,
  tier text,
  vq_score integer,
  published_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.title,
    p.summary,
    p.researcher_name,
    p.region_label,
    p.project_tag,
    p.tier,
    p.vq_score,
    p.published_at
  from public.projects p
  where p.status = 'published'
  order by p.published_at desc;
$$;

create or replace function public.get_public_project_detail(project_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  problem_statement text,
  hypothesis text,
  methodology text,
  evidence_urls text[],
  region_label text,
  systems_impact text,
  public_good_case text,
  reproducibility_note text,
  citations text,
  project_tag text,
  tier text,
  vq_score integer,
  researcher_name text,
  researcher_school text,
  researcher_id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.title,
    p.summary,
    p.problem_statement,
    p.hypothesis,
    p.methodology,
    p.evidence_urls,
    p.region_label,
    p.systems_impact,
    p.public_good_case,
    p.reproducibility_note,
    p.citations,
    p.project_tag,
    p.tier,
    p.vq_score,
    p.researcher_name,
    p.researcher_school,
    p.researcher_id
  from public.projects p
  where p.status = 'published' and p.slug = project_slug;
$$;

revoke all on function public.get_public_project_cards() from public;
revoke all on function public.get_public_project_detail(text) from public;
grant execute on function public.get_public_project_cards() to anon, authenticated;
grant execute on function public.get_public_project_detail(text) to anon, authenticated;
```

**Immediate correction code block (app)**
```js
// app/journal/page.jsx
const { data: projects } = await supabase.rpc('get_public_project_cards');
```

```js
// app/project/[slug]/page.jsx
const { data } = await supabase.rpc('get_public_project_detail', { project_slug: slug });
const project = data?.[0] || null;
```

---

### 6) UPI privacy is unlocked by any accepted requester; there is no mentor-role gate
**Where:**
- `supabase/migrations/20260726_preclore_v24_public_good_registry.sql`
- `app/api/mentorship-requests/route.js`
- `app/project/[slug]/page.jsx`

**Problem:**
Any authenticated account can request access; once accepted, they can unlock `parent_upi_id`. The requirements refer to accepted mentors, but there is no role model.

**Immediate correction code block (SQL)**
```sql
alter table public.users
  add column if not exists role text not null default 'student'
    check (role in ('student', 'mentor', 'admin', 'alumni_readonly'));

create or replace function public.get_connected_parent_upi(target_researcher_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  upi_value text;
begin
  if auth.uid() is null then
    return null;
  end if;

  if auth.uid() = target_researcher_id or exists (
    select 1
    from public.mentorship_requests mr
    join public.users u on u.id = mr.requester_id
    where mr.researcher_id = target_researcher_id
      and mr.requester_id = auth.uid()
      and mr.status = 'accepted'
      and u.role in ('mentor', 'admin')
  ) then
    select parent_upi_id into upi_value
    from public.users
    where id = target_researcher_id;

    return upi_value;
  end if;

  return null;
end;
$$;
```

**Immediate correction code block (API)**
```js
// app/api/mentorship-requests/route.js
const { data: me } = await supabase
  .from('users')
  .select('role, display_name')
  .eq('id', user.id)
  .maybeSingle();

if (!me || !['mentor', 'admin'].includes(me.role)) {
  return NextResponse.json(
    { error: 'Only mentor accounts can request protected researcher funding access.' },
    { status: 403 }
  );
}
```

---

### 7) Server-side confirmation is bypassable
**Where:** `app/api/projects/route.js`

**Problem:**
The UI asks users to confirm public-good instant publication, but the API never checks `confirmPublicGood`. A scripted POST can publish without it.

**Immediate correction code block**
```js
if (body.confirmPublicGood !== true) {
  return NextResponse.json(
    { error: 'Public-good publication confirmation is required.' },
    { status: 400 }
  );
}
```

---

## MEDIUM

### 8) `scoreProject(undefined|null)` crashes and malformed JSON can 500 the API
**Where:**
- `lib/vq-engine.js`
- `app/api/projects/route.js`
- `app/api/profile/route.js`
- `app/api/mentorship-requests/route.js`

**Observed behavior:**
`scoreProject(undefined)` throws: `Cannot read properties of undefined (reading 'projectTag')`.

**Immediate correction code block (VQ engine)**
```js
export function scoreProject(input = {}) {
  const form = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  const projectTag = PROJECT_TAG_COMPAT.includes(form.projectTag)
    ? form.projectTag
    : 'Academic Theory';

  // ...rest of scoring logic uses `form`
}
```

**Immediate correction code block (safe JSON parse)**
```js
async function readJsonObject(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return body;
  } catch {
    return null;
  }
}

const body = await readJsonObject(request);
if (!body) {
  return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
}
```

---

### 9) Requested scoring rules are missing: no `1.1x Academic Multiplier`, no `0.5x AI Penalty`
**Where:** `lib/vq-engine.js`

**Problem:**
The current engine never applies the requested multiplier/penalty, so the ranking logic is not compliant.

**Immediate correction code block**
```js
export function scoreProject(input = {}) {
  const form = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const projectTag = PROJECT_TAG_COMPAT.includes(form.projectTag)
    ? form.projectTag
    : 'Academic Theory';

  const foundation = presenceScore(
    [form.title, form.summary, form.problemStatement, form.hypothesis, form.methodology],
    4
  );

  const clarity = clamp(
    lengthScore(form.summary, 25, 80, 7) +
      lengthScore(form.problemStatement, 30, 90, 7) +
      lengthScore(form.hypothesis, 18, 60, 6),
    0,
    20
  );

  const evidence = evidenceScore(form);
  const systems = clamp(
    lengthScore(form.systemsImpact, 20, 80, 10) +
      keywordScore(`${form.systemsImpact || ''} ${form.publicGoodCase || ''}`, SYSTEMS_KEYWORDS, 10),
    0,
    20
  );

  const publicGood = clamp(lengthScore(form.publicGoodCase, 20, 75, 10), 0, 20);

  const baseTotal = clamp(foundation + clarity + evidence + systems + publicGood, 0, 100);
  const academicMultiplier = projectTag === 'Academic Theory' ? 1.1 : 1;
  const aiPenalty = form.aiRiskFlag === true ? 0.5 : 1;
  const total = clamp(Math.round(baseTotal * academicMultiplier * aiPenalty), 0, 100);
  const tier = tierFromScore(total);

  return {
    total,
    tier: tier.name,
    publishable: true,
    breakdown: { foundation, clarity, evidence, systems, publicGood },
    modifiers: { academicMultiplier, aiPenalty }
  };
}
```

---

### 10) Client-supplied `researcherName` can be spoofed in follow requests
**Where:** `app/api/mentorship-requests/route.js`

**Problem:**
The API trusts `body.researcherName` from the browser. A user can submit any label they want.

**Immediate correction code block**
```js
const { data: target } = await supabase
  .from('users')
  .select('display_name')
  .eq('id', body.researcherId)
  .maybeSingle();

if (!target) {
  return NextResponse.json({ error: 'Researcher not found.' }, { status: 404 });
}

const payload = {
  requester_id: user.id,
  requester_name: requesterName,
  researcher_id: body.researcherId,
  researcher_name: target.display_name || 'Researcher',
  status: 'pending'
};
```

---

### 11) No UPI format validation on profile save
**Where:** `app/api/profile/route.js`

**Problem:**
Any string can be stored as `parent_upi_id`, including garbage values. This causes unreliable payment UX and makes abuse harder to detect.

**Immediate correction code block**
```js
const upi = body.parent_upi_id?.trim() || null;
const upiPattern = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

if (upi && !upiPattern.test(upi)) {
  return NextResponse.json({ error: 'Invalid parent UPI ID format.' }, { status: 400 });
}

const payload = {
  id: user.id,
  display_name: body.display_name || 'Researcher',
  username: body.username || `researcher-${user.id.slice(0, 8)}`,
  school_name: body.school_name || null,
  grade_level: body.grade_level || null,
  bio: body.bio || null,
  parent_upi_id: upi,
  updated_at: new Date().toISOString()
};
```

---

### 12) Commercial/grant language still appears in copy/comments
**Where:**
- `app/project/[slug]/page.jsx`
- `app/page.jsx`
- `README.md`
- `supabase/migrations/...sql`

**Examples found:**
- `No Preclore grants, prize pools, or entry fees.`
- `No grants. No entry fees. No platform payouts.`
- `No platform grants, prize pools, fees, or pricing constants.`
- `Remove grants / fee architecture...`

**Problem:**
Even if logic is removed, some copy still references the old commercial/grant model instead of purely registry/facilitator language.

**Immediate correction code block**
```jsx
// app/project/[slug]/page.jsx
<li>• Registry-only platform. No platform-managed sponsorship disbursements.</li>
<li>• Voluntary mission support is separate from researcher support.</li>
<li>• Eligible researcher support routes directly to the parental buffer UPI.</li>
```

```jsx
// app/page.jsx
<h2 className="mt-3 text-3xl font-black text-ink">Registry-first. Voluntary mission support. Direct researcher routing.</h2>
```

```md
# README.md
- **Registry-only logic:** No platform-managed grant payouts or mandatory pricing flows.
```

---

### 13) Repo/path drift from requested `/src` architecture
**Where:** entire repo layout

**Problem:**
The requested files are absent:
- `src/lib/constants.ts`
- `src/app/mentorship/actions.ts`
- `design-tokens.ts`
- `review-pipeline.ts`
- `video-metadata.ts`

There are no broken imports, but this is still a spec drift risk if tooling or team docs expect `/src`.

**Immediate correction code block**
```ts
// src/lib/constants.ts
export * from '../../lib/constants.js';
```

```ts
// src/app/mentorship/actions.ts
export async function createMentorshipRequest(payload: { researcherId: string }) {
  const response = await fetch('/api/mentorship-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
}
```

```ts
// src/lib/design-tokens.ts
export const warmAcademicPastel = {
  paper: '#fff9ef',
  ink: '#2c2b2a',
  mint: '#d8f2d0',
  peach: '#ffd9c7',
  butter: '#ffe8a3',
  lilac: '#e8dcff',
  sky: '#d6ebff',
  coral: '#ff8f70',
  forest: '#166a51'
};
```

```ts
// src/lib/review-pipeline.ts
import { scoreProject } from '../../lib/vq-engine.js';
export function deterministicReview(input: Record<string, unknown>) {
  return scoreProject(input);
}
```

```ts
// src/lib/video-metadata.ts
export function normalizeVideoEvidence(urls: string[] = []) {
  return urls.map((url) => ({ url, provider: 'external', verified: false }));
}
```

---

## Recommended order of fixes
1. Upgrade Next.js to `16.2.12`.
2. Patch the auth open redirect.
3. Remove email-derived display names.
4. Add age/alumni read-only enforcement in both proxy and API.
5. Replace public table select with sanitized public RPCs/views.
6. Add mentor-role gating to UPI disclosure.
7. Harden JSON/body validation and require `confirmPublicGood` server-side.
8. Rework VQ engine with safe input normalization + requested multipliers.
9. Validate UPI format.
10. Clean up old commercial/grant copy.

## Bottom line
The codebase is functionally close to the product direction, but it is **not yet safe for production deployment** in its current state because of:
- a vulnerable Next.js version,
- an auth redirect flaw,
- public identity leakage,
- missing submission access controls,
- and over-broad public project access.
