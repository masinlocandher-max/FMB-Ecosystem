-- With love, FMB production schema
-- Run in the Supabase SQL editor as the project owner.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Member',
  role text not null default 'member' check (role in ('member','moderator','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists joined_at timestamptz;

update public.profiles
set full_name = coalesce(nullif(full_name,''), nullif(display_name,''), split_part(coalesce(email,'member@example.com'),'@',1), 'Member')
where full_name is null or full_name = '';

update public.profiles
set username = 'member_' || left(replace(id::text,'-',''),10)
where username is null or username = '';

update public.profiles
set joined_at = coalesce(joined_at,created_at,now())
where joined_at is null;

alter table public.profiles alter column full_name set not null;
alter table public.profiles alter column username set not null;
alter table public.profiles alter column joined_at set not null;
alter table public.profiles alter column joined_at set default now();

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('active','suspended'));
alter table public.profiles drop constraint if exists profiles_full_name_length;
alter table public.profiles add constraint profiles_full_name_length check (char_length(full_name) between 2 and 80);
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$');
alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length check (bio is null or char_length(bio) <= 500);
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));


create or replace function public.is_fmb_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin') and status = 'active');
$$;

create or replace function public.is_fmb_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

-- ---------------------------------------------------------------------------
-- Curated community content
-- ---------------------------------------------------------------------------



create table if not exists public.freedom_wall_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 40),
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','published','rejected','changes_requested')),
  moderation_note text,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.freedom_wall_posts add column if not exists moderation_note text;
alter table public.freedom_wall_posts add column if not exists moderated_by uuid references auth.users(id) on delete set null;
alter table public.freedom_wall_posts add column if not exists moderated_at timestamptz;
alter table public.freedom_wall_posts add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Content and wellness resources
-- ---------------------------------------------------------------------------
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,100}$'),
  title text not null check (char_length(title) between 2 and 180),
  excerpt text check (excerpt is null or char_length(excerpt) <= 500),
  body text,
  category text not null default 'general',
  audience text[] not null default '{}',
  source_url text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  alt_text text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contact and administrative activity
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact' check (kind in ('contact','volunteer')),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'new' check (status in ('new','resolved','archived')),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- New-user trigger: profile + recorded legal versions
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id,email,display_name,full_name,username,role,status,joined_at)
  values (new.id,new.email,coalesce(split_part(new.email,'@',1),'User'),coalesce(split_part(new.email,'@',1),'User'),'user_' || left(replace(new.id::text,'-',''),10),'member','active',now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists wall_updated_at on public.freedom_wall_posts;
create trigger wall_updated_at before update on public.freedom_wall_posts for each row execute procedure public.set_updated_at();
drop trigger if exists content_updated_at on public.content_items;
create trigger content_updated_at before update on public.content_items for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Secure RPCs
-- ---------------------------------------------------------------------------
create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_kind text default 'contact'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if p_kind not in ('contact','volunteer') then raise exception 'Invalid message type'; end if;
  if char_length(trim(p_name)) not between 1 and 80 then raise exception 'Invalid name'; end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 254 then raise exception 'Invalid email'; end if;
  if char_length(trim(p_subject)) not between 1 and 120 then raise exception 'Invalid subject'; end if;
  if char_length(trim(p_message)) not between 1 and 4000 then raise exception 'Invalid message'; end if;
  if (select count(*) from public.contact_messages where lower(email)=v_email and created_at > now()-interval '10 minutes') >= 4 then
    raise exception 'Please wait before sending another message';
  end if;
  insert into public.contact_messages(kind,name,email,subject,message)
  values(p_kind,trim(p_name),v_email,trim(p_subject),trim(p_message)) returning id into v_id;
  return v_id;
end;
$$;


create or replace function public.admin_set_message_status(p_message_id uuid,p_status text)
returns public.contact_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.contact_messages;
begin
  if not public.is_fmb_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('new','resolved','archived') then raise exception 'Invalid status'; end if;
  update public.contact_messages
  set status=p_status,resolved_at=case when p_status='resolved' then now() else resolved_at end,resolved_by=case when p_status='resolved' then auth.uid() else resolved_by end
  where id=p_message_id returning * into v_message;
  insert into public.admin_activity(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'message_status_updated','contact_message',p_message_id::text,jsonb_build_object('status',p_status));
  return v_message;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.freedom_wall_posts enable row level security;
alter table public.content_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_activity enable row level security;

-- Remove legacy policies before creating the production set.
drop policy if exists "profiles owner read" on public.profiles;
drop policy if exists "profiles owner insert" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;




drop policy if exists "published community read" on public.freedom_wall_posts;
drop policy if exists "member submits pending post" on public.freedom_wall_posts;
drop policy if exists "member updates own pending post" on public.freedom_wall_posts;
drop policy if exists "member deletes own unpublished post" on public.freedom_wall_posts;
drop policy if exists "staff moderates community" on public.freedom_wall_posts;

drop policy if exists "profiles self or admin read" on public.profiles;



grant select on public.freedom_wall_posts to anon,authenticated;
revoke insert,update,delete on public.freedom_wall_posts from anon,authenticated;
grant select on public.content_items to anon,authenticated;
grant insert,update,delete on public.content_items to authenticated;
grant select,insert,update,delete on public.media_assets,public.contact_messages,public.admin_activity to authenticated;
revoke insert on public.contact_messages from anon,authenticated;

grant execute on function public.submit_contact_message(text,text,text,text,text) to anon,authenticated;

grant execute on function public.admin_set_message_status(uuid,text) to authenticated;

grant execute on function public.is_fmb_staff() to anon,authenticated;
grant execute on function public.is_fmb_admin() to anon,authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-media','site-media',true,15728640,array['image/jpeg','image/png','image/webp','image/svg+xml','audio/mpeg','audio/mp4','audio/wav','audio/ogg'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "avatar owner upload" on storage.objects;
create index if not exists wall_status_created_idx on public.freedom_wall_posts(status,created_at desc);
create index if not exists content_status_sort_idx on public.content_items(status,sort_order,created_at desc);
create index if not exists contact_status_created_idx on public.contact_messages(status,created_at desc);
create index if not exists activity_created_idx on public.admin_activity(created_at desc);
