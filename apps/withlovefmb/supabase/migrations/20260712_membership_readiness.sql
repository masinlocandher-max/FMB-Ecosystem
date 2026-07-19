-- With love, FMB membership launch gate
-- Run this after supabase/schema.sql in the Supabase SQL Editor.
-- Registration is closed by default until an administrator intentionally opens it.

create table if not exists public.membership_settings (
  singleton boolean primary key default true check (singleton),
  registration_open boolean not null default false,
  schema_version text not null default '2026-07-12',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.membership_settings (singleton, registration_open, schema_version)
values (true, false, '2026-07-12')
on conflict (singleton) do nothing;

alter table public.membership_settings enable row level security;
revoke all on public.membership_settings from anon, authenticated;

create or replace function public.get_membership_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ready', true,
    'registration_open', registration_open,
    'schema_version', schema_version,
    'updated_at', updated_at
  )
  from public.membership_settings
  where singleton = true;
$$;

create or replace function public.admin_set_membership_open(p_open boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_fmb_admin() then
    raise exception 'Administrator access required';
  end if;

  update public.membership_settings
  set registration_open = p_open,
      updated_by = auth.uid(),
      updated_at = now()
  where singleton = true;

  insert into public.admin_activity(actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    case when p_open then 'membership_opened' else 'membership_closed' end,
    'membership_settings',
    'singleton',
    jsonb_build_object('registration_open', p_open)
  );

  select public.get_membership_status() into v_result;
  return v_result;
end;
$$;

grant execute on function public.get_membership_status() to anon, authenticated;
grant execute on function public.admin_set_membership_open(boolean) to authenticated;
