-- Restore the verified owner administrator and keep public membership open.

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

  insert into public.profiles (
    id, email, display_name, full_name, username, role, status, joined_at
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
    actor_id, action, entity_type, entity_id, details
  )
  values (
    v_uid,
    'owner_admin_confirmed',
    'profile',
    v_uid::text,
    jsonb_build_object('email', v_email)
  );

  return v_profile;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_username text;
  v_role text := 'member';
  v_membership text;
  v_privacy text;
  v_guidelines text;
begin
  v_name := left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1),'Member'),80);
  v_username := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'username',''),v_name,'member'),'[^a-zA-Z0-9_]+','_','g'));
  v_username := trim(both '_' from v_username);
  if char_length(v_username) < 3 then v_username := 'member'; end if;
  v_username := left(v_username,16) || '_' || left(replace(new.id::text,'-',''),6);

  if lower(new.email) in ('fbautisat23@gmail.com','withlovefmb@gmail.com') then
    v_role := 'admin';
  end if;

  insert into public.profiles (id,email,display_name,full_name,username,role,status,joined_at)
  values (new.id,new.email,v_name,v_name,v_username,v_role,'active',now())
  on conflict (id) do nothing;

  v_membership := new.raw_user_meta_data->>'accepted_membership_version';
  v_privacy := new.raw_user_meta_data->>'accepted_privacy_version';
  v_guidelines := new.raw_user_meta_data->>'accepted_guidelines_version';

  if v_membership is not null then
    insert into public.legal_acceptances(user_id,document_type,document_version)
    values(new.id,'membership',v_membership) on conflict do nothing;
  end if;
  if v_privacy is not null then
    insert into public.legal_acceptances(user_id,document_type,document_version)
    values(new.id,'privacy',v_privacy) on conflict do nothing;
  end if;
  if v_guidelines is not null then
    insert into public.legal_acceptances(user_id,document_type,document_version)
    values(new.id,'community_guidelines',v_guidelines) on conflict do nothing;
  end if;

  return new;
end;
$$;

update public.profiles
set role = 'admin', status = 'active', updated_at = now()
where lower(email) in ('fbautisat23@gmail.com','withlovefmb@gmail.com');

update public.membership_settings
set registration_open = true,
    schema_version = '2026-07-14-auth-repair',
    updated_at = now()
where singleton = true;

notify pgrst, 'reload schema';
