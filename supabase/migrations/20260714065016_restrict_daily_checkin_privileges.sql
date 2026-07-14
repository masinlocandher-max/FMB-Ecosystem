-- Explicitly remove the DELETE privilege granted by legacy public-schema defaults.
revoke all on table public.daily_checkins from authenticated;
grant select, insert, update on table public.daily_checkins to authenticated;
