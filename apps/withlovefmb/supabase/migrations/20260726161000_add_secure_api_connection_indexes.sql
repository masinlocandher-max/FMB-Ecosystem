-- Cover relationship lookups used by ownership changes and OAuth cleanup.

create index if not exists automation_integration_credentials_updated_by_idx
  on private.automation_integration_credentials(updated_by);

create index if not exists automation_provider_tokens_connected_by_idx
  on private.automation_provider_tokens(connected_by);

create index if not exists automation_oauth_states_owner_idx
  on private.automation_oauth_states(owner_id);

create index if not exists automation_oauth_states_provider_idx
  on private.automation_oauth_states(provider_key);

create index if not exists automation_connection_events_actor_idx
  on public.automation_connection_events(actor_id);
