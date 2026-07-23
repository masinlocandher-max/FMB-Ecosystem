-- Private FMB&CO. Orchestrator workspace.
-- One JSON document keeps the operational surface flexible without adding a CRM-sized schema.

create table if not exists public.orchestrator_workspaces (
  workspace_key text primary key check (char_length(workspace_key) between 1 and 80),
  owner_id uuid not null references auth.users(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);

create index if not exists orchestrator_workspaces_owner_idx
  on public.orchestrator_workspaces(owner_id);

alter table public.orchestrator_workspaces enable row level security;

drop policy if exists "orchestrator admin read" on public.orchestrator_workspaces;
create policy "orchestrator admin read"
on public.orchestrator_workspaces for select to authenticated
using ((select private.is_fmb_admin()));

drop policy if exists "orchestrator admin insert" on public.orchestrator_workspaces;
create policy "orchestrator admin insert"
on public.orchestrator_workspaces for insert to authenticated
with check (
  (select private.is_fmb_admin())
  and owner_id = (select auth.uid())
);

drop policy if exists "orchestrator admin update" on public.orchestrator_workspaces;
create policy "orchestrator admin update"
on public.orchestrator_workspaces for update to authenticated
using ((select private.is_fmb_admin()))
with check (
  (select private.is_fmb_admin())
  and owner_id = (select auth.uid())
);

revoke all on public.orchestrator_workspaces from public, anon, authenticated;
grant select, insert, update on public.orchestrator_workspaces to authenticated;
