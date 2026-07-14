-- With love, FMB Supabase security hardening
-- Apply after supabase/schema.sql and 20260712_membership_readiness.sql.
-- This migration is idempotent and keeps public registration closed unless an active admin opens it.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- Internal authorization helpers stay outside the exposed Data API schema.
create or replace function private.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'active'
  );
$$;

create or replace function private.is_fmb_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('moderator','admin')
      and status = 'active'
  );
$$;

create or replace function private.is_fmb_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

revoke all on function private.is_active_member() from public, anon, authenticated, service_role;
revoke all on function private.is_fmb_staff() from public, anon, authenticated, service_role;
revoke all on function private.is_fmb_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_active_member() to authenticated, service_role;
grant execute on function private.is_fmb_staff() to authenticated, service_role;
grant execute on function private.is_fmb_admin() to authenticated, service_role;

-- Keep compatibility helpers non-privileged and unavailable to anonymous callers.
create or replace function public.is_active_member()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_active_member(); $$;

create or replace function public.is_fmb_staff()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_fmb_staff(); $$;

create or replace function public.is_fmb_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_fmb_admin(); $$;

revoke all on function public.is_active_member() from public, anon, authenticated, service_role;
revoke all on function public.is_fmb_staff() from public, anon, authenticated, service_role;
revoke all on function public.is_fmb_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_active_member() to authenticated, service_role;
grant execute on function public.is_fmb_staff() to authenticated, service_role;
grant execute on function public.is_fmb_admin() to authenticated, service_role;

-- Trigger functions must not be callable as RPCs.
alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';
revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;

-- Membership readiness can be read publicly without privileged execution.
alter table public.membership_settings enable row level security;
drop policy if exists "membership status read" on public.membership_settings;
create policy "membership status read"
on public.membership_settings for select to anon, authenticated
using (singleton = true);
grant select on public.membership_settings to anon, authenticated;

create or replace function public.get_membership_status()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'ready', true,
    'registration_open', ms.registration_open,
    'schema_version', ms.schema_version,
    'updated_at', ms.updated_at
  )
  from public.membership_settings as ms
  where ms.singleton = true;
$$;
revoke all on function public.get_membership_status() from public, anon, authenticated, service_role;
grant execute on function public.get_membership_status() to anon, authenticated, service_role;

-- Public contact RPC is an unprivileged wrapper over a private validated implementation.
create or replace function private.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_kind text default 'contact'
)
returns uuid
language plpgsql
security definer
set search_path = ''
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
revoke all on function private.submit_contact_message(text,text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function private.submit_contact_message(text,text,text,text,text) to anon, authenticated, service_role;

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_kind text default 'contact'
)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.submit_contact_message(p_name,p_email,p_subject,p_message,p_kind); $$;
revoke all on function public.submit_contact_message(text,text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.submit_contact_message(text,text,text,text,text) to anon, authenticated, service_role;

-- Membership mutation is exposed through a non-privileged wrapper.
create or replace function private.admin_set_membership_open(p_open boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_fmb_admin() then raise exception 'Administrator access required'; end if;
  update public.membership_settings
  set registration_open=p_open,
      updated_by=(select auth.uid()),
      updated_at=now()
  where singleton=true;
  insert into public.admin_activity(actor_id,action,entity_type,entity_id,details)
  values(
    (select auth.uid()),
    case when p_open then 'membership_opened' else 'membership_closed' end,
    'membership_settings',
    'singleton',
    jsonb_build_object('registration_open',p_open)
  );
  select public.get_membership_status() into v_result;
  return v_result;
end;
$$;
revoke all on function private.admin_set_membership_open(boolean) from public, anon, authenticated, service_role;
grant execute on function private.admin_set_membership_open(boolean) to authenticated, service_role;

create or replace function public.admin_set_membership_open(p_open boolean)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.admin_set_membership_open(p_open); $$;
revoke all on function public.admin_set_membership_open(boolean) from public, anon, authenticated, service_role;
grant execute on function public.admin_set_membership_open(boolean) to authenticated, service_role;

-- Existing administrator mutations remain authenticated-only and fixed-path.
alter function public.admin_update_member(uuid,text,text) set search_path = '';
alter function public.admin_set_message_status(uuid,text) set search_path = '';
revoke all on function public.admin_update_member(uuid,text,text) from public, anon, authenticated, service_role;
revoke all on function public.admin_set_message_status(uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.admin_update_member(uuid,text,text) to authenticated, service_role;
grant execute on function public.admin_set_message_status(uuid,text) to authenticated, service_role;

-- Member-owned data policies.
drop policy if exists "profiles self or admin read" on public.profiles;
create policy "profiles self or admin read" on public.profiles for select to authenticated
using (id=(select auth.uid()) or (select private.is_fmb_admin()));
drop policy if exists "profiles owner safe update" on public.profiles;
create policy "profiles owner safe update" on public.profiles for update to authenticated
using (id=(select auth.uid()) and (select private.is_active_member()))
with check (id=(select auth.uid()) and (select private.is_active_member()));

drop policy if exists "legal owner or admin read" on public.legal_acceptances;
create policy "legal owner or admin read" on public.legal_acceptances for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_fmb_admin()));

drop policy if exists "journal active owner read" on public.journal_entries;
drop policy if exists "journal active owner insert" on public.journal_entries;
drop policy if exists "journal active owner update" on public.journal_entries;
drop policy if exists "journal active owner delete" on public.journal_entries;
create policy "journal active owner read" on public.journal_entries for select to authenticated
using (user_id=(select auth.uid()) and (select private.is_active_member()));
create policy "journal active owner insert" on public.journal_entries for insert to authenticated
with check (user_id=(select auth.uid()) and (select private.is_active_member()));
create policy "journal active owner update" on public.journal_entries for update to authenticated
using (user_id=(select auth.uid()) and (select private.is_active_member()))
with check (user_id=(select auth.uid()) and (select private.is_active_member()));
create policy "journal active owner delete" on public.journal_entries for delete to authenticated
using (user_id=(select auth.uid()) and (select private.is_active_member()));

drop policy if exists "saved active owner select" on public.saved_content;
drop policy if exists "saved active owner insert" on public.saved_content;
drop policy if exists "saved active owner update" on public.saved_content;
drop policy if exists "saved active owner delete" on public.saved_content;
create policy "saved active owner select" on public.saved_content for select to authenticated
using (user_id=(select auth.uid()) and (select private.is_active_member()));
create policy "saved active owner insert" on public.saved_content for insert to authenticated
with check (user_id=(select auth.uid()) and (select private.is_active_member()));
create policy "saved active owner update" on public.saved_content for update to authenticated
using (user_id=(select auth.uid()) and (select private.is_active_member()))
with check (user_id=(select auth.uid()) and (select private.is_active_member()));
create policy "saved active owner delete" on public.saved_content for delete to authenticated
using (user_id=(select auth.uid()) and (select private.is_active_member()));

-- Community policies: one read policy per role and one combined update policy.
drop policy if exists "wall public owner staff read" on public.freedom_wall_posts;
drop policy if exists "wall published read" on public.freedom_wall_posts;
drop policy if exists "wall published read anon" on public.freedom_wall_posts;
drop policy if exists "wall owner or staff read" on public.freedom_wall_posts;
drop policy if exists "wall readable authenticated" on public.freedom_wall_posts;
drop policy if exists "wall active member insert" on public.freedom_wall_posts;
drop policy if exists "wall owner revise" on public.freedom_wall_posts;
drop policy if exists "wall staff moderate" on public.freedom_wall_posts;
drop policy if exists "wall owner or staff update" on public.freedom_wall_posts;
drop policy if exists "wall owner delete unpublished" on public.freedom_wall_posts;
create policy "wall published read anon" on public.freedom_wall_posts for select to anon
using (status='published');
create policy "wall readable authenticated" on public.freedom_wall_posts for select to authenticated
using (status='published' or user_id=(select auth.uid()) or (select private.is_fmb_staff()));
create policy "wall active member insert" on public.freedom_wall_posts for insert to authenticated
with check (user_id=(select auth.uid()) and status='pending' and (select private.is_active_member()));
create policy "wall owner or staff update" on public.freedom_wall_posts for update to authenticated
using (
  (select private.is_fmb_staff())
  or (user_id=(select auth.uid()) and status in ('pending','changes_requested') and (select private.is_active_member()))
)
with check (
  (select private.is_fmb_staff())
  or (user_id=(select auth.uid()) and status='pending' and (select private.is_active_member()))
);
create policy "wall owner delete unpublished" on public.freedom_wall_posts for delete to authenticated
using (user_id=(select auth.uid()) and status<>'published' and (select private.is_active_member()));

-- Published content and administrator policies.
drop policy if exists "content public or admin read" on public.content_items;
drop policy if exists "content published read" on public.content_items;
drop policy if exists "content admin read" on public.content_items;
drop policy if exists "content published read anon" on public.content_items;
drop policy if exists "content readable authenticated" on public.content_items;
drop policy if exists "content admin insert" on public.content_items;
drop policy if exists "content admin update" on public.content_items;
drop policy if exists "content admin delete" on public.content_items;
create policy "content published read anon" on public.content_items for select to anon using (status='published');
create policy "content readable authenticated" on public.content_items for select to authenticated
using (status='published' or (select private.is_fmb_admin()));
create policy "content admin insert" on public.content_items for insert to authenticated with check ((select private.is_fmb_admin()));
create policy "content admin update" on public.content_items for update to authenticated
using ((select private.is_fmb_admin())) with check ((select private.is_fmb_admin()));
create policy "content admin delete" on public.content_items for delete to authenticated using ((select private.is_fmb_admin()));

drop policy if exists "music public or admin read" on public.music_entries;
drop policy if exists "music published read" on public.music_entries;
drop policy if exists "music admin read" on public.music_entries;
drop policy if exists "music published read anon" on public.music_entries;
drop policy if exists "music readable authenticated" on public.music_entries;
drop policy if exists "music admin insert" on public.music_entries;
drop policy if exists "music admin update" on public.music_entries;
drop policy if exists "music admin delete" on public.music_entries;
create policy "music published read anon" on public.music_entries for select to anon using (status='published');
create policy "music readable authenticated" on public.music_entries for select to authenticated
using (status='published' or (select private.is_fmb_admin()));
create policy "music admin insert" on public.music_entries for insert to authenticated with check ((select private.is_fmb_admin()));
create policy "music admin update" on public.music_entries for update to authenticated
using ((select private.is_fmb_admin())) with check ((select private.is_fmb_admin()));
create policy "music admin delete" on public.music_entries for delete to authenticated using ((select private.is_fmb_admin()));

drop policy if exists "media admin select" on public.media_assets;
drop policy if exists "media admin insert" on public.media_assets;
drop policy if exists "media admin update" on public.media_assets;
drop policy if exists "media admin delete" on public.media_assets;
create policy "media admin select" on public.media_assets for select to authenticated using ((select private.is_fmb_admin()));
create policy "media admin insert" on public.media_assets for insert to authenticated with check ((select private.is_fmb_admin()));
create policy "media admin update" on public.media_assets for update to authenticated
using ((select private.is_fmb_admin())) with check ((select private.is_fmb_admin()));
create policy "media admin delete" on public.media_assets for delete to authenticated using ((select private.is_fmb_admin()));

drop policy if exists "contact admin read" on public.contact_messages;
drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin read" on public.contact_messages for select to authenticated using ((select private.is_fmb_admin()));
create policy "contact admin update" on public.contact_messages for update to authenticated
using ((select private.is_fmb_admin())) with check ((select private.is_fmb_admin()));

drop policy if exists "activity admin read" on public.admin_activity;
drop policy if exists "activity admin insert" on public.admin_activity;
create policy "activity admin read" on public.admin_activity for select to authenticated using ((select private.is_fmb_admin()));
create policy "activity admin insert" on public.admin_activity for insert to authenticated with check ((select private.is_fmb_admin()));

-- Storage upserts require matching SELECT, INSERT and UPDATE permissions.
drop policy if exists "avatar owner select" on storage.objects;
drop policy if exists "avatar owner upload" on storage.objects;
drop policy if exists "avatar owner update" on storage.objects;
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner select" on storage.objects for select to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "avatar owner upload" on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_active_member()));
create policy "avatar owner update" on storage.objects for update to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.is_active_member()));
create policy "avatar owner delete" on storage.objects for delete to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "site media admin select" on storage.objects;
drop policy if exists "site media admin insert" on storage.objects;
drop policy if exists "site media admin update" on storage.objects;
drop policy if exists "site media admin delete" on storage.objects;
create policy "site media admin select" on storage.objects for select to authenticated
using (bucket_id='site-media' and (select private.is_fmb_admin()));
create policy "site media admin insert" on storage.objects for insert to authenticated
with check (bucket_id='site-media' and (select private.is_fmb_admin()));
create policy "site media admin update" on storage.objects for update to authenticated
using (bucket_id='site-media' and (select private.is_fmb_admin()))
with check (bucket_id='site-media' and (select private.is_fmb_admin()));
create policy "site media admin delete" on storage.objects for delete to authenticated
using (bucket_id='site-media' and (select private.is_fmb_admin()));

-- Cover foreign keys used by moderation, authorship and audit workflows.
create index if not exists admin_activity_actor_id_idx on public.admin_activity(actor_id);
create index if not exists contact_messages_resolved_by_idx on public.contact_messages(resolved_by);
create index if not exists content_items_created_by_idx on public.content_items(created_by);
create index if not exists content_items_updated_by_idx on public.content_items(updated_by);
create index if not exists freedom_wall_posts_user_id_idx on public.freedom_wall_posts(user_id);
create index if not exists freedom_wall_posts_moderated_by_idx on public.freedom_wall_posts(moderated_by);
create index if not exists media_assets_uploaded_by_idx on public.media_assets(uploaded_by);
create index if not exists membership_settings_updated_by_idx on public.membership_settings(updated_by);
create index if not exists music_entries_created_by_idx on public.music_entries(created_by);
create index if not exists music_entries_updated_by_idx on public.music_entries(updated_by);

update public.membership_settings
set schema_version='2026-07-14-secure', updated_at=now()
where singleton=true;

notify pgrst, 'reload schema';
