-- Preclore v2.4 Minimalist Public Good Registry
-- Safe to run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  school_name text,
  grade_level text,
  bio text,
  parent_upi_id text,
  birth_year int,
  role text not null default 'student' check (role in ('student', 'mentor', 'admin', 'alumni_readonly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references public.users(id) on delete cascade,
  researcher_name text not null,
  researcher_school text,
  slug text not null unique,
  title text not null,
  summary text not null,
  problem_statement text not null,
  hypothesis text not null,
  methodology text not null,
  evidence_urls text[] not null default '{}',
  region_label text not null,
  systems_impact text not null,
  public_good_case text not null,
  reproducibility_note text,
  citations text,
  project_tag text not null check (project_tag in ('Academic Theory', 'Field Verified', 'Project: Needs Funding', 'Needs Funding', 'Idea Only')),
  vq_score integer not null default 0 check (vq_score >= 0 and vq_score <= 100),
  tier text not null check (tier in ('Bronze', 'Silver', 'Gold', 'Platinum')),
  vq_breakdown jsonb not null default '{}'::jsonb,
  quest_answers jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('published')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  requester_name text not null,
  researcher_id uuid not null references public.users(id) on delete cascade,
  researcher_name text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, researcher_id)
);

-- Additive compatibility for existing installs following the prompt snippet.
alter table public.projects add column if not exists project_tag text;
alter table public.users add column if not exists parent_upi_id text;
alter table public.users add column if not exists birth_year int;
alter table public.users add column if not exists role text default 'student';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_project_tag_check'
  ) then
    alter table public.projects
      add constraint projects_project_tag_check
      check (project_tag in ('Academic Theory', 'Field Verified', 'Project: Needs Funding', 'Needs Funding', 'Idea Only'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('student', 'mentor', 'admin', 'alumni_readonly'));
  end if;
end $$;

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.mentorship_requests enable row level security;

create or replace function public.is_current_user_mentor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('mentor', 'admin')
  );
$$;

revoke all on function public.is_current_user_mentor() from public;
grant execute on function public.is_current_user_mentor() to authenticated;

-- Registry-only architecture: no platform-managed sponsorship or mandatory pricing tables are created.

drop policy if exists "Public can read published projects" on public.projects;
drop policy if exists "Researchers can read own projects" on public.projects;
create policy "Researchers can read own projects"
on public.projects
for select
using (auth.uid() = researcher_id);

drop policy if exists "Researchers can insert own projects" on public.projects;
create policy "Researchers can insert own projects"
on public.projects
for insert
with check (auth.uid() = researcher_id);

drop policy if exists "Researchers can update own projects" on public.projects;
create policy "Researchers can update own projects"
on public.projects
for update
using (auth.uid() = researcher_id)
with check (auth.uid() = researcher_id);

drop policy if exists "Protect student UPI" on public.users;
drop policy if exists "Users can read self profile" on public.users;
create policy "Users can read self profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can insert self profile" on public.users;
create policy "Users can insert self profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update self profile" on public.users;
create policy "Users can update self profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Participants can read mentorship requests" on public.mentorship_requests;
create policy "Participants can read mentorship requests"
on public.mentorship_requests
for select
using (auth.uid() = requester_id or auth.uid() = researcher_id);

drop policy if exists "Requester can create mentorship request" on public.mentorship_requests;
create policy "Requester can create mentorship request"
on public.mentorship_requests
for insert
with check (auth.uid() = requester_id and public.is_current_user_mentor());

drop policy if exists "Researcher can respond to mentorship request" on public.mentorship_requests;
create policy "Researcher can respond to mentorship request"
on public.mentorship_requests
for update
using (auth.uid() = researcher_id)
with check (auth.uid() = researcher_id);

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
    join public.users requester on requester.id = mr.requester_id
    where mr.researcher_id = target_researcher_id
      and mr.requester_id = auth.uid()
      and mr.status = 'accepted'
      and requester.role in ('mentor', 'admin')
  ) then
    select parent_upi_id into upi_value
    from public.users
    where id = target_researcher_id;

    return upi_value;
  end if;

  return null;
end;
$$;

revoke all on function public.get_connected_parent_upi(uuid) from public;
grant execute on function public.get_connected_parent_upi(uuid) to authenticated;

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
  where p.status = 'published'
    and p.slug = project_slug;
$$;

revoke all on function public.get_public_project_cards() from public;
revoke all on function public.get_public_project_detail(text) from public;
grant execute on function public.get_public_project_cards() to anon, authenticated;
grant execute on function public.get_public_project_detail(text) to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'users_touch_updated_at') then
    create trigger users_touch_updated_at before update on public.users for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'projects_touch_updated_at') then
    create trigger projects_touch_updated_at before update on public.projects for each row execute function public.touch_updated_at();
  end if;
end $$;