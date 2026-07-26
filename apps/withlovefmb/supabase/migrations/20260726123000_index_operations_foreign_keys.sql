create index if not exists automation_connections_created_by_idx
  on public.automation_connections (created_by)
  where created_by is not null;

create index if not exists automation_connections_verified_by_idx
  on public.automation_connections (verified_by)
  where verified_by is not null;

create index if not exists work_evidence_reviewed_by_idx
  on public.work_evidence (reviewed_by)
  where reviewed_by is not null;

create index if not exists work_evidence_submitted_by_idx
  on public.work_evidence (submitted_by);

create index if not exists work_order_events_actor_id_idx
  on public.work_order_events (actor_id);

create index if not exists work_orders_approved_by_idx
  on public.work_orders (approved_by)
  where approved_by is not null;

create index if not exists work_orders_created_by_idx
  on public.work_orders (created_by);
