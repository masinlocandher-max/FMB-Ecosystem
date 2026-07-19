-- Private daily check-ins for the With love, FMB member landing page.
-- Each active member owns one check-in per local calendar date.

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  mood smallint not null check (mood between 1 and 5),
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_checkins_user_date_key unique (user_id, checkin_date)
);

comment on table public.daily_checkins is 'Private daily emotional check-ins owned by one authenticated member.';
comment on column public.daily_checkins.mood is 'Member-selected scale from 1 heavy to 5 strong.';

alter table public.daily_checkins enable row level security;

drop trigger if exists daily_checkins_updated_at on public.daily_checkins;
create trigger daily_checkins_updated_at
before update on public.daily_checkins
for each row execute procedure public.set_updated_at();

drop policy if exists "checkins active owner select" on public.daily_checkins;
drop policy if exists "checkins active owner insert" on public.daily_checkins;
drop policy if exists "checkins active owner update" on public.daily_checkins;

create policy "checkins active owner select"
on public.daily_checkins for select to authenticated
using (user_id = (select auth.uid()) and (select private.is_active_member()));

create policy "checkins active owner insert"
on public.daily_checkins for insert to authenticated
with check (user_id = (select auth.uid()) and (select private.is_active_member()));

create policy "checkins active owner update"
on public.daily_checkins for update to authenticated
using (user_id = (select auth.uid()) and (select private.is_active_member()))
with check (user_id = (select auth.uid()) and (select private.is_active_member()));

revoke all on table public.daily_checkins from public, anon, authenticated;
grant select, insert, update on table public.daily_checkins to authenticated;
grant all on table public.daily_checkins to service_role;

update public.membership_settings
set schema_version = '2026-07-14-member-landing', updated_at = now()
where singleton = true;
