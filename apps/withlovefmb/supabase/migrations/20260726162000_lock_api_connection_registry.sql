-- API connection state is evidence, not an editable browser record.
-- Only the service-role integration gateway may insert or update it.

drop policy if exists "connections admin insert"
  on public.automation_connections;
drop policy if exists "connections admin update"
  on public.automation_connections;

revoke insert,update on table public.automation_connections
  from authenticated;

-- Staff may triage an inbound automation event but may not rewrite its
-- provider identity, sender references, timestamp, or signed payload.
revoke update on table public.automation_inbox_events
  from authenticated;
grant update(processing_status,processed_at)
  on table public.automation_inbox_events
  to authenticated;
