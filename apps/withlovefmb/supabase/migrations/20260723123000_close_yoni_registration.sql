-- Keep Yoni profile creation closed unless a reviewed database migration deliberately changes the policy.

update public.membership_settings
set registration_open = false,
    updated_at = now()
where singleton = true;

alter table public.membership_settings
  drop constraint if exists membership_settings_registration_closed;
alter table public.membership_settings
  add constraint membership_settings_registration_closed
  check (registration_open = false);

create or replace function private.admin_set_membership_open(p_open boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_fmb_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_open then
    raise exception 'Yoni registration is closed and cannot be opened from the application';
  end if;

  update public.membership_settings
  set registration_open = false,
      updated_by = (select auth.uid()),
      updated_at = now()
  where singleton = true;

  insert into public.admin_activity(actor_id,action,entity_type,entity_id,details)
  values(
    (select auth.uid()),
    'membership_closed',
    'membership_settings',
    'singleton',
    jsonb_build_object('registration_open',false)
  );

  select public.get_membership_status() into v_result;
  return v_result;
end;
$$;

revoke all on function private.admin_set_membership_open(boolean)
  from public, anon, authenticated, service_role;
grant execute on function private.admin_set_membership_open(boolean)
  to authenticated, service_role;

notify pgrst, 'reload schema';
