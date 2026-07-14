-- With love, FMB initial administrator owner claim
-- The function is callable only by an authenticated user and accepts only the verified owner email.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.claim_initial_admin_impl()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select lower(u.email)
  into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is distinct from 'fbautisat23@gmail.com' then
    raise exception 'Owner email required';
  end if;

  perform pg_advisory_xact_lock(20260714, 2301);

  if exists (
    select 1
    from public.profiles p
    where p.role = 'admin'
      and p.status = 'active'
      and p.id <> v_uid
  ) then
    raise exception 'Initial administrator has already been claimed';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    full_name,
    username,
    role,
    status,
    joined_at
  )
  values (
    v_uid,
    v_email,
    'Francine Marie Bautista',
    'Francine Marie Bautista',
    'francinemariebautista',
    'admin',
    'active',
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = case
        when public.profiles.display_name is null or public.profiles.display_name = 'Member'
          then excluded.display_name
        else public.profiles.display_name
      end,
      full_name = case
        when public.profiles.full_name is null or char_length(trim(public.profiles.full_name)) < 2
          then excluded.full_name
        else public.profiles.full_name
      end,
      username = case
        when public.profiles.username is null or public.profiles.username = 'member'
          then excluded.username
        else public.profiles.username
      end,
      role = 'admin',
      status = 'active',
      updated_at = now()
  returning * into v_profile;

  insert into public.admin_activity (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    v_uid,
    'initial_admin_claimed',
    'profile',
    v_uid::text,
    jsonb_build_object('email', v_email)
  );

  return v_profile;
end;
$$;

revoke all on function private.claim_initial_admin_impl() from public, anon;
grant execute on function private.claim_initial_admin_impl() to authenticated, service_role;

create or replace function public.claim_initial_admin()
returns public.profiles
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.claim_initial_admin_impl();
$$;

revoke all on function public.claim_initial_admin() from public, anon;
grant execute on function public.claim_initial_admin() to authenticated, service_role;

update public.membership_settings
set schema_version = '2026-07-14-admin-bootstrap',
    updated_at = now()
where singleton = true;
