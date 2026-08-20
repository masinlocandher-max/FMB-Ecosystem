-- Retire the former public FMB membership/account data tools.
-- Profiles and Supabase Auth remain because the private FMB&CO. Orchestrator uses them for staff/admin authorization.

drop function if exists public.admin_update_member(uuid,text,text);
drop function if exists public.is_active_member();
drop table if exists public.saved_content cascade;
drop table if exists public.daily_checkins cascade;
drop table if exists public.journal_entries cascade;
drop table if exists public.legal_acceptances cascade;
