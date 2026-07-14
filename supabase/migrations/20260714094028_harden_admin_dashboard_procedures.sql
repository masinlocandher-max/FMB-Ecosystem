-- Keep privileged dashboard work private while preserving public RPC names.

create or replace function private.admin_set_message_status_impl(p_message_id uuid, p_status text)
returns public.contact_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.contact_messages;
begin
  if not public.is_fmb_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('new','resolved','archived') then raise exception 'Invalid status'; end if;

  update public.contact_messages
  set status = p_status,
      resolved_at = case when p_status = 'resolved' then now() else resolved_at end,
      resolved_by = case when p_status = 'resolved' then auth.uid() else resolved_by end
  where id = p_message_id returning * into v_message;

  if v_message.id is null then raise exception 'Message not found'; end if;

  insert into public.admin_activity(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'message_status_updated','contact_message',p_message_id::text,jsonb_build_object('status',p_status));
  return v_message;
end;
$$;

revoke all on function private.admin_set_message_status_impl(uuid,text) from public, anon;
grant execute on function private.admin_set_message_status_impl(uuid,text) to authenticated, service_role;

create or replace function public.admin_set_message_status(p_message_id uuid, p_status text)
returns public.contact_messages
language sql
volatile
security invoker
set search_path = ''
as $$ select private.admin_set_message_status_impl(p_message_id,p_status); $$;

revoke all on function public.admin_set_message_status(uuid,text) from public, anon;
grant execute on function public.admin_set_message_status(uuid,text) to authenticated, service_role;

create or replace function private.admin_update_member_impl(p_user_id uuid, p_role text, p_status text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_target_email text;
begin
  if not public.is_fmb_admin() then raise exception 'Administrator access required'; end if;
  if p_role not in ('member','moderator','admin') then raise exception 'Invalid role'; end if;
  if p_status not in ('active','suspended') then raise exception 'Invalid status'; end if;

  select lower(p.email) into v_target_email from public.profiles p where p.id = p_user_id;
  if v_target_email is null then raise exception 'Member not found'; end if;
  if v_target_email in ('fbautisat23@gmail.com','withlovefmb@gmail.com')
     and (p_role <> 'admin' or p_status <> 'active') then
    raise exception 'The owner administrator account must remain active';
  end if;
  if p_user_id = auth.uid() and p_status = 'suspended' then
    raise exception 'You cannot suspend your own administrator account';
  end if;

  update public.profiles set role=p_role,status=p_status,updated_at=now()
  where id=p_user_id returning * into v_profile;
  insert into public.admin_activity(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'member_updated','profile',p_user_id::text,jsonb_build_object('role',p_role,'status',p_status));
  return v_profile;
end;
$$;

revoke all on function private.admin_update_member_impl(uuid,text,text) from public, anon;
grant execute on function private.admin_update_member_impl(uuid,text,text) to authenticated, service_role;

create or replace function public.admin_update_member(p_user_id uuid, p_role text, p_status text)
returns public.profiles
language sql
volatile
security invoker
set search_path = ''
as $$ select private.admin_update_member_impl(p_user_id,p_role,p_status); $$;

revoke all on function public.admin_update_member(uuid,text,text) from public, anon;
grant execute on function public.admin_update_member(uuid,text,text) to authenticated, service_role;

update public.membership_settings
set schema_version = '2026-07-14-auth-security', updated_at = now()
where singleton = true;

notify pgrst, 'reload schema';
