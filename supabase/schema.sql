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

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;

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
-- Legal acceptance records
-- ---------------------------------------------------------------------------
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('membership','privacy','community_guidelines')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  unique(user_id,document_type,document_version)
);

-- ---------------------------------------------------------------------------
-- Member tools
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 160),
  title text not null check (char_length(title) between 1 and 180),
  url text not null check (char_length(url) between 1 and 500),
  category text,
  created_at timestamptz not null default now(),
  unique(user_id,item_key)
);

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
-- Content, wellness resources and music
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

create table if not exists public.music_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  artist text not null default 'FMB' check (char_length(artist) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  category text not null default 'Made by FMB',
  audio_url text not null,
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
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
declare
  v_name text;
  v_username text;
  v_membership text;
  v_privacy text;
  v_guidelines text;
begin
  v_name := left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1),'Member'),80);
  v_username := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'username',''),v_name,'member'),'[^a-zA-Z0-9_]+','_','g'));
  v_username := trim(both '_' from v_username);
  if char_length(v_username) < 3 then v_username := 'member'; end if;
  v_username := left(v_username,16) || '_' || left(replace(new.id::text,'-',''),6);

  insert into public.profiles (id,email,display_name,full_name,username,role,status,joined_at)
  values (new.id,new.email,v_name,v_name,v_username,'member','active',now())
  on conflict (id) do nothing;

  v_membership := new.raw_user_meta_data->>'accepted_membership_version';
  v_privacy := new.raw_user_meta_data->>'accepted_privacy_version';
  v_guidelines := new.raw_user_meta_data->>'accepted_guidelines_version';
  if v_membership is not null then
    insert into public.legal_acceptances(user_id,document_type,document_version) values(new.id,'membership',v_membership) on conflict do nothing;
  end if;
  if v_privacy is not null then
    insert into public.legal_acceptances(user_id,document_type,document_version) values(new.id,'privacy',v_privacy) on conflict do nothing;
  end if;
  if v_guidelines is not null then
    insert into public.legal_acceptances(user_id,document_type,document_version) values(new.id,'community_guidelines',v_guidelines) on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists journal_updated_at on public.journal_entries;
create trigger journal_updated_at before update on public.journal_entries for each row execute procedure public.set_updated_at();
drop trigger if exists wall_updated_at on public.freedom_wall_posts;
create trigger wall_updated_at before update on public.freedom_wall_posts for each row execute procedure public.set_updated_at();
drop trigger if exists content_updated_at on public.content_items;
create trigger content_updated_at before update on public.content_items for each row execute procedure public.set_updated_at();
drop trigger if exists music_updated_at on public.music_entries;
create trigger music_updated_at before update on public.music_entries for each row execute procedure public.set_updated_at();

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

create or replace function public.admin_update_member(p_user_id uuid,p_role text,p_status text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_fmb_admin() then raise exception 'Administrator access required'; end if;
  if p_role not in ('member','moderator','admin') then raise exception 'Invalid role'; end if;
  if p_status not in ('active','suspended') then raise exception 'Invalid status'; end if;
  if p_user_id = auth.uid() and p_status = 'suspended' then raise exception 'You cannot suspend your own administrator account'; end if;
  update public.profiles set role=p_role,status=p_status,updated_at=now() where id=p_user_id returning * into v_profile;
  if v_profile.id is null then raise exception 'Member not found'; end if;
  insert into public.admin_activity(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'member_updated','profile',p_user_id::text,jsonb_build_object('role',p_role,'status',p_status));
  return v_profile;
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
alter table public.legal_acceptances enable row level security;
alter table public.journal_entries enable row level security;
alter table public.saved_content enable row level security;
alter table public.freedom_wall_posts enable row level security;
alter table public.content_items enable row level security;
alter table public.music_entries enable row level security;
alter table public.media_assets enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_activity enable row level security;

-- Remove legacy policies before creating the production set.
drop policy if exists "profiles owner read" on public.profiles;
drop policy if exists "profiles owner insert" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;
drop policy if exists "journal owner read" on public.journal_entries;
drop policy if exists "journal owner insert" on public.journal_entries;
drop policy if exists "journal owner update" on public.journal_entries;
drop policy if exists "journal owner delete" on public.journal_entries;
drop policy if exists "published community read" on public.freedom_wall_posts;
drop policy if exists "member submits pending post" on public.freedom_wall_posts;
drop policy if exists "member updates own pending post" on public.freedom_wall_posts;
drop policy if exists "member deletes own unpublished post" on public.freedom_wall_posts;
drop policy if exists "staff moderates community" on public.freedom_wall_posts;

drop policy if exists "profiles self or admin read" on public.profiles;
create policy "profiles self or admin read" on public.profiles for select using (id=auth.uid() or public.is_fmb_admin());
drop policy if exists "profiles owner safe update" on public.profiles;
create policy "profiles owner safe update" on public.profiles for update using (id=auth.uid() and public.is_active_member()) with check (id=auth.uid() and public.is_active_member());

drop policy if exists "legal owner or admin read" on public.legal_acceptances;
create policy "legal owner or admin read" on public.legal_acceptances for select using (user_id=auth.uid() or public.is_fmb_admin());

drop policy if exists "journal active owner read" on public.journal_entries;
create policy "journal active owner read" on public.journal_entries for select using (user_id=auth.uid() and public.is_active_member());
drop policy if exists "journal active owner insert" on public.journal_entries;
create policy "journal active owner insert" on public.journal_entries for insert with check (user_id=auth.uid() and public.is_active_member());
drop policy if exists "journal active owner update" on public.journal_entries;
create policy "journal active owner update" on public.journal_entries for update using (user_id=auth.uid() and public.is_active_member()) with check (user_id=auth.uid() and public.is_active_member());
drop policy if exists "journal active owner delete" on public.journal_entries;
create policy "journal active owner delete" on public.journal_entries for delete using (user_id=auth.uid() and public.is_active_member());

drop policy if exists "saved active owner all" on public.saved_content;
create policy "saved active owner select" on public.saved_content for select using (user_id=auth.uid() and public.is_active_member());
create policy "saved active owner insert" on public.saved_content for insert with check (user_id=auth.uid() and public.is_active_member());
create policy "saved active owner update" on public.saved_content for update using (user_id=auth.uid() and public.is_active_member()) with check (user_id=auth.uid() and public.is_active_member());
create policy "saved active owner delete" on public.saved_content for delete using (user_id=auth.uid() and public.is_active_member());

drop policy if exists "wall public owner staff read" on public.freedom_wall_posts;
create policy "wall public owner staff read" on public.freedom_wall_posts for select using (status='published' or user_id=auth.uid() or public.is_fmb_staff());
drop policy if exists "wall active member insert" on public.freedom_wall_posts;
create policy "wall active member insert" on public.freedom_wall_posts for insert with check (user_id=auth.uid() and status='pending' and public.is_active_member());
drop policy if exists "wall owner revise" on public.freedom_wall_posts;
create policy "wall owner revise" on public.freedom_wall_posts for update using (user_id=auth.uid() and status in ('pending','changes_requested') and public.is_active_member()) with check (user_id=auth.uid() and status='pending' and public.is_active_member());
drop policy if exists "wall owner delete unpublished" on public.freedom_wall_posts;
create policy "wall owner delete unpublished" on public.freedom_wall_posts for delete using (user_id=auth.uid() and status<>'published' and public.is_active_member());
drop policy if exists "wall staff moderate" on public.freedom_wall_posts;
create policy "wall staff moderate" on public.freedom_wall_posts for update using (public.is_fmb_staff()) with check (public.is_fmb_staff());

drop policy if exists "content public or admin read" on public.content_items;
create policy "content public or admin read" on public.content_items for select using (status='published' or public.is_fmb_admin());
drop policy if exists "content admin insert" on public.content_items;
create policy "content admin insert" on public.content_items for insert with check (public.is_fmb_admin());
drop policy if exists "content admin update" on public.content_items;
create policy "content admin update" on public.content_items for update using (public.is_fmb_admin()) with check (public.is_fmb_admin());
drop policy if exists "content admin delete" on public.content_items;
create policy "content admin delete" on public.content_items for delete using (public.is_fmb_admin());

drop policy if exists "music public or admin read" on public.music_entries;
create policy "music public or admin read" on public.music_entries for select using (status='published' or public.is_fmb_admin());
drop policy if exists "music admin insert" on public.music_entries;
create policy "music admin insert" on public.music_entries for insert with check (public.is_fmb_admin());
drop policy if exists "music admin update" on public.music_entries;
create policy "music admin update" on public.music_entries for update using (public.is_fmb_admin()) with check (public.is_fmb_admin());
drop policy if exists "music admin delete" on public.music_entries;
create policy "music admin delete" on public.music_entries for delete using (public.is_fmb_admin());

drop policy if exists "media admin all" on public.media_assets;
create policy "media admin select" on public.media_assets for select using (public.is_fmb_admin());
create policy "media admin insert" on public.media_assets for insert with check (public.is_fmb_admin());
create policy "media admin update" on public.media_assets for update using (public.is_fmb_admin()) with check (public.is_fmb_admin());
create policy "media admin delete" on public.media_assets for delete using (public.is_fmb_admin());

drop policy if exists "contact admin read" on public.contact_messages;
create policy "contact admin read" on public.contact_messages for select using (public.is_fmb_admin());
drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin update" on public.contact_messages for update using (public.is_fmb_admin()) with check (public.is_fmb_admin());

drop policy if exists "activity admin read" on public.admin_activity;
create policy "activity admin read" on public.admin_activity for select using (public.is_fmb_admin());
drop policy if exists "activity admin insert" on public.admin_activity;
create policy "activity admin insert" on public.admin_activity for insert with check (public.is_fmb_admin());

-- ---------------------------------------------------------------------------
-- Privileges: members may never update role, status, email or joined_at.
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon;
revoke insert,delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name,full_name,username,bio,interests,avatar_url,updated_at) on public.profiles to authenticated;

grant select on public.legal_acceptances to authenticated;
grant select,insert,update,delete on public.journal_entries to authenticated;
grant select,insert,update,delete on public.saved_content to authenticated;
grant select on public.freedom_wall_posts to anon,authenticated;
grant insert,update,delete on public.freedom_wall_posts to authenticated;
grant select on public.content_items,public.music_entries to anon,authenticated;
grant insert,update,delete on public.content_items,public.music_entries to authenticated;
grant select,insert,update,delete on public.media_assets,public.contact_messages,public.admin_activity to authenticated;
revoke insert on public.contact_messages from anon,authenticated;

grant execute on function public.submit_contact_message(text,text,text,text,text) to anon,authenticated;
grant execute on function public.admin_update_member(uuid,text,text) to authenticated;
grant execute on function public.admin_set_message_status(uuid,text) to authenticated;
grant execute on function public.is_active_member() to anon,authenticated;
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
create policy "avatar owner upload" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active_member());
drop policy if exists "avatar owner update" on storage.objects;
create policy "avatar owner update" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active_member());
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "site media admin insert" on storage.objects;
create policy "site media admin insert" on storage.objects for insert to authenticated with check (bucket_id='site-media' and public.is_fmb_admin());
drop policy if exists "site media admin update" on storage.objects;
create policy "site media admin update" on storage.objects for update to authenticated using (bucket_id='site-media' and public.is_fmb_admin()) with check (bucket_id='site-media' and public.is_fmb_admin());
drop policy if exists "site media admin delete" on storage.objects;
create policy "site media admin delete" on storage.objects for delete to authenticated using (bucket_id='site-media' and public.is_fmb_admin());

create index if not exists journal_user_created_idx on public.journal_entries(user_id,created_at desc);
create index if not exists wall_status_created_idx on public.freedom_wall_posts(status,created_at desc);
create index if not exists content_status_sort_idx on public.content_items(status,sort_order,created_at desc);
create index if not exists music_status_sort_idx on public.music_entries(status,sort_order,created_at desc);
create index if not exists contact_status_created_idx on public.contact_messages(status,created_at desc);
create index if not exists activity_created_idx on public.admin_activity(created_at desc);
