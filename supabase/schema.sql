create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Friend',
  role text not null default 'member' check (role in ('member','moderator','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.freedom_wall_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 40),
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','published','rejected','changes_requested')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.freedom_wall_posts enable row level security;

create or replace function public.is_fmb_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator','admin')
  );
$$;

create policy "profiles owner read" on public.profiles for select using (id = auth.uid() or public.is_fmb_staff());
create policy "profiles owner insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles owner update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "journal owner read" on public.journal_entries for select using (user_id = auth.uid());
create policy "journal owner insert" on public.journal_entries for insert with check (user_id = auth.uid());
create policy "journal owner update" on public.journal_entries for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "journal owner delete" on public.journal_entries for delete using (user_id = auth.uid());

create policy "published community read" on public.freedom_wall_posts for select using (status = 'published' or user_id = auth.uid() or public.is_fmb_staff());
create policy "member submits pending post" on public.freedom_wall_posts for insert with check (user_id = auth.uid() and status = 'pending');
create policy "member updates own pending post" on public.freedom_wall_posts for update using (user_id = auth.uid() and status in ('pending','changes_requested')) with check (user_id = auth.uid() and status = 'pending');
create policy "member deletes own unpublished post" on public.freedom_wall_posts for delete using (user_id = auth.uid() and status <> 'published');
create policy "staff moderates community" on public.freedom_wall_posts for update using (public.is_fmb_staff()) with check (public.is_fmb_staff());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id,email,display_name)
  values (new.id,new.email,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Friend'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
