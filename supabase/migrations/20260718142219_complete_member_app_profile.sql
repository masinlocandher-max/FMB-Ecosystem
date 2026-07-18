begin;

-- Member-controlled presentation settings. Private identity fields stay on the
-- existing profile row and are never exposed through the Freedom Wall.
alter table public.profiles
  add column if not exists username_changed_at timestamptz,
  add column if not exists app_theme text not null default 'violet',
  add column if not exists avatar_preset text;

alter table public.profiles drop constraint if exists profiles_app_theme_check;
alter table public.profiles
  add constraint profiles_app_theme_check
  check (app_theme in ('violet','navy','forest','slate'));

alter table public.profiles drop constraint if exists profiles_avatar_preset_check;
alter table public.profiles
  add constraint profiles_avatar_preset_check
  check (avatar_preset is null or avatar_preset in ('orange','apple','grapes','cherry','peach','lemon','blueberry','watermelon'));

-- Full name and display name are verified account identity, not public profile
-- fields. Username changes are allowed, then protected for 60 days.
create or replace function private.enforce_member_profile_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_next_change timestamptz;
begin
  if new.full_name is distinct from old.full_name
     or new.display_name is distinct from old.display_name then
    raise exception using
      errcode = 'P0001',
      message = 'Real name cannot be changed from profile settings';
  end if;

  if new.username is distinct from old.username then
    v_next_change := old.username_changed_at + interval '60 days';
    if old.username_changed_at is not null and statement_timestamp() < v_next_change then
      raise exception using
        errcode = 'P0001',
        message = format(
          'Username can be changed again on %s',
          to_char(v_next_change at time zone 'UTC','FMMonth DD, YYYY')
        );
    end if;
    new.username_changed_at := statement_timestamp();
  else
    new.username_changed_at := old.username_changed_at;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_member_profile_identity() from public, anon, authenticated, service_role;

drop trigger if exists profiles_enforce_member_identity on public.profiles;
create trigger profiles_enforce_member_identity
before update on public.profiles
for each row execute function private.enforce_member_profile_identity();

revoke update (full_name,display_name) on public.profiles from authenticated;
grant update (username,bio,interests,avatar_url,app_theme,avatar_preset,updated_at)
on public.profiles to authenticated;

-- Every member submission begins in moderation and uses only the protected
-- profile username. A visitor cannot supply a real name as the public alias.
create or replace function private.prepare_freedom_wall_post()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_username text;
begin
  if new.user_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'Freedom Wall owner does not match the signed-in profile';
  end if;

  select p.username
    into v_username
    from public.profiles as p
   where p.id = new.user_id
     and p.status = 'active';

  if v_username is null then
    raise exception using errcode = '42501', message = 'An active profile is required to post';
  end if;

  new.alias := '@' || v_username;
  new.status := 'pending';
  new.moderation_note := null;
  new.moderated_by := null;
  new.moderated_at := null;
  new.published_at := null;
  return new;
end;
$$;

revoke all on function private.prepare_freedom_wall_post() from public, anon, authenticated, service_role;

drop trigger if exists freedom_wall_prepare_member_post on public.freedom_wall_posts;
create trigger freedom_wall_prepare_member_post
before insert on public.freedom_wall_posts
for each row execute function private.prepare_freedom_wall_post();

-- Remove any historical real-name aliases where a linked profile is known.
update public.freedom_wall_posts as post
set alias = '@' || profile.username
from public.profiles as profile
where post.user_id = profile.id
  and post.alias is distinct from '@' || profile.username;

update public.membership_settings
set schema_version = '2026-07-18-complete-member-app',
    updated_at = now()
where singleton = true;

commit;
