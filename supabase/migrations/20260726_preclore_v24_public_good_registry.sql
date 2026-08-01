-- Preclore v2.5 Minimalist Public Good Registry
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
    role text not null default 'student' check (role in ('student', 'alumni_readonly')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Policies for public.users
create policy "Users can view all user profiles"
    on public.users for select
    using (true);

create policy "Users can insert their own profile"
    on public.users for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.users for update
    using (auth.uid() = id);

-- Trigger to handle updated_at automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at();
