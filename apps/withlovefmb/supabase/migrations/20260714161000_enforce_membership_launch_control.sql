-- Make the administrator registration switch authoritative at the database layer.
-- Owner accounts remain recoverable even when public registration is closed.
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
  v_registration_open boolean := false;
begin
  select ms.registration_open
    into v_registration_open
    from public.membership_settings as ms
   where ms.singleton = true;

  if lower(coalesce(new.email,'')) not in ('fbautisat23@gmail.com','withlovefmb@gmail.com')
     and coalesce(v_registration_open,false) is not true then
    raise exception using
      errcode = 'P0001',
      message = 'Membership registration is closed';
  end if;

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

revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;

update public.membership_settings
set schema_version = '2026-07-15-member-launch',
    updated_at = now()
where singleton = true;
