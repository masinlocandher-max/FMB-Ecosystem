-- Secure API connections for the FMB Automation Center.
-- Provider app credentials, OAuth verifiers, access tokens, and refresh tokens
-- are encrypted with Supabase Vault. Only the server-side Edge Function may
-- call the credential RPCs. Browser clients receive readiness metadata only.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter table public.automation_connections
  add column if not exists integration_key text,
  add column if not exists granted_scopes text[] not null default '{}'::text[],
  add column if not exists external_account_id text;

update public.automation_connections
set integration_key = case provider_key
  when 'main_website' then 'native'
  when 'supabase_workspace' then 'native'
  when 'facebook_page' then 'meta'
  when 'instagram_business' then 'meta'
  when 'messenger' then 'meta'
  when 'linkedin_page' then 'linkedin'
  when 'youtube_channel' then 'google'
  when 'canva' then 'canva'
  when 'google_drive' then 'google'
  when 'gmail' then 'google'
  when 'github' then 'github'
  when 'chatgpt_handoff' then 'openai'
  else provider_key
end
where integration_key is null;

alter table public.automation_connections
  alter column integration_key set not null;

alter table public.automation_connections
  drop constraint if exists automation_connections_integration_key_format;
alter table public.automation_connections
  add constraint automation_connections_integration_key_format
  check (integration_key ~ '^[a-z0-9][a-z0-9_-]{1,79}$');

create index if not exists automation_connections_integration_idx
  on public.automation_connections(integration_key,status);

create table if not exists private.automation_integration_credentials (
  integration_key text primary key
    check (integration_key in ('meta','google','linkedin','canva','github','openai')),
  client_id_secret_id uuid,
  client_secret_secret_id uuid,
  api_key_secret_id uuid,
  config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(config) = 'object'),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.automation_provider_tokens (
  provider_key text primary key references public.automation_connections(provider_key) on delete cascade,
  access_token_secret_id uuid not null,
  refresh_token_secret_id uuid,
  token_type text not null default 'Bearer'
    check (char_length(token_type) between 2 and 30),
  scopes text[] not null default '{}'::text[],
  expires_at timestamptz,
  external_account_id text,
  external_account_label text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  connected_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (external_account_id is null or char_length(external_account_id) <= 300),
  check (external_account_label is null or char_length(external_account_label) <= 300)
);

create table if not exists private.automation_oauth_states (
  state_hash text primary key
    check (state_hash ~ '^[A-Za-z0-9_-]{40,100}$'),
  integration_key text not null
    check (integration_key in ('meta','google','linkedin','canva','github')),
  provider_key text not null references public.automation_connections(provider_key) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  code_verifier_secret_id uuid not null,
  redirect_to text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (char_length(redirect_to) between 8 and 1000)
);

create index if not exists automation_oauth_states_expiry_idx
  on private.automation_oauth_states(expires_at);

create table if not exists public.automation_connection_events (
  id bigint generated always as identity primary key,
  provider_key text not null references public.automation_connections(provider_key) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null
    check (event_type in (
      'credentials_saved','authorization_started','connected','verified',
      'connection_error','disconnected','webhook_verified','webhook_received'
    )),
  detail jsonb not null default '{}'::jsonb
    check (jsonb_typeof(detail) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists automation_connection_events_provider_created_idx
  on public.automation_connection_events(provider_key,created_at desc);

create table if not exists public.automation_inbox_events (
  id bigint generated always as identity primary key,
  provider_key text not null references public.automation_connections(provider_key) on delete restrict,
  external_event_id text,
  event_type text not null
    check (char_length(event_type) between 2 and 100),
  sender_ref text,
  recipient_ref text,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  processing_status text not null default 'received'
    check (processing_status in ('received','queued','processed','ignored','error')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  check (external_event_id is null or char_length(external_event_id) <= 500),
  check (sender_ref is null or char_length(sender_ref) <= 500),
  check (recipient_ref is null or char_length(recipient_ref) <= 500)
);

create unique index if not exists automation_inbox_external_event_uidx
  on public.automation_inbox_events(provider_key,external_event_id);
create index if not exists automation_inbox_status_received_idx
  on public.automation_inbox_events(processing_status,received_at);

alter table public.automation_connection_events enable row level security;
alter table public.automation_inbox_events enable row level security;

drop policy if exists "connection events staff read" on public.automation_connection_events;
create policy "connection events staff read"
on public.automation_connection_events for select to authenticated
using ((select private.is_fmb_staff()));

drop policy if exists "automation inbox staff read" on public.automation_inbox_events;
create policy "automation inbox staff read"
on public.automation_inbox_events for select to authenticated
using ((select private.is_fmb_staff()));

drop policy if exists "automation inbox staff update" on public.automation_inbox_events;
create policy "automation inbox staff update"
on public.automation_inbox_events for update to authenticated
using ((select private.is_fmb_staff()))
with check ((select private.is_fmb_staff()));

revoke all on table private.automation_integration_credentials from public, anon, authenticated;
revoke all on table private.automation_provider_tokens from public, anon, authenticated;
revoke all on table private.automation_oauth_states from public, anon, authenticated;
revoke all on table public.automation_connection_events from public, anon, authenticated;
revoke all on table public.automation_inbox_events from public, anon, authenticated;
grant select on table public.automation_connection_events to authenticated;
grant select,update on table public.automation_inbox_events to authenticated;
grant usage,select on sequence public.automation_connection_events_id_seq to authenticated;
grant usage,select on sequence public.automation_inbox_events_id_seq to authenticated;

create or replace function private.is_fmb_connection_owner(p_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = p_actor_id
      and p.role = 'admin'
      and p.status = 'active'
      and lower(u.email) in ('fbautisat23@gmail.com','withlovefmb@gmail.com')
  );
$$;

revoke all on function private.is_fmb_connection_owner(uuid)
  from public, anon, authenticated;
grant execute on function private.is_fmb_connection_owner(uuid)
  to service_role;

create or replace function private.upsert_fmb_vault_secret(
  p_existing_id uuid,
  p_secret text,
  p_name text,
  p_description text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_existing_id;
  v_secret text := nullif(p_secret,'');
begin
  if v_secret is null then
    return v_id;
  end if;

  if v_id is not null
     and exists (select 1 from vault.secrets where id = v_id) then
    perform vault.update_secret(v_id,v_secret,p_name,p_description);
    return v_id;
  end if;

  return vault.create_secret(v_secret,p_name,p_description);
end;
$$;

revoke all on function private.upsert_fmb_vault_secret(uuid,text,text,text)
  from public, anon, authenticated, service_role;

create or replace function private.delete_fmb_vault_secret(p_secret_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_secret_id is not null then
    delete from vault.secrets where id = p_secret_id;
  end if;
end;
$$;

revoke all on function private.delete_fmb_vault_secret(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.ops_upsert_integration_credentials(
  p_integration_key text,
  p_client_id text,
  p_client_secret text,
  p_api_key text,
  p_config jsonb,
  p_actor_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_row private.automation_integration_credentials;
  v_client_id_id uuid;
  v_client_secret_id uuid;
  v_api_key_id uuid;
  v_config jsonb := coalesce(p_config,'{}'::jsonb);
begin
  if not (select private.is_fmb_connection_owner(p_actor_id)) then
    raise exception using errcode='42501', message='FMB owner access is required';
  end if;
  if p_integration_key not in ('meta','google','linkedin','canva','github','openai') then
    raise exception using errcode='22023', message='Unknown integration';
  end if;
  if jsonb_typeof(v_config) is distinct from 'object'
     or octet_length(v_config::text) > 12000 then
    raise exception using errcode='22023', message='Integration configuration is invalid';
  end if;

  perform pg_advisory_xact_lock(hashtext('fmb-credentials:' || p_integration_key));

  select * into v_row
  from private.automation_integration_credentials
  where integration_key = p_integration_key
  for update;

  v_client_id_id := private.upsert_fmb_vault_secret(
    v_row.client_id_secret_id,
    nullif(trim(coalesce(p_client_id,'')),''),
    'fmb/' || p_integration_key || '/client-id',
    'FMB Automation Center provider client ID'
  );
  v_client_secret_id := private.upsert_fmb_vault_secret(
    v_row.client_secret_secret_id,
    nullif(trim(coalesce(p_client_secret,'')),''),
    'fmb/' || p_integration_key || '/client-secret',
    'FMB Automation Center provider client secret'
  );
  v_api_key_id := private.upsert_fmb_vault_secret(
    v_row.api_key_secret_id,
    nullif(trim(coalesce(p_api_key,'')),''),
    'fmb/' || p_integration_key || '/api-key',
    'FMB Automation Center API or webhook secret'
  );

  insert into private.automation_integration_credentials(
    integration_key,
    client_id_secret_id,
    client_secret_secret_id,
    api_key_secret_id,
    config,
    updated_by
  ) values (
    p_integration_key,
    v_client_id_id,
    v_client_secret_id,
    v_api_key_id,
    coalesce(v_config,nullif(v_row.config,'{}'::jsonb),'{}'::jsonb),
    p_actor_id
  )
  on conflict (integration_key) do update
  set client_id_secret_id = excluded.client_id_secret_id,
      client_secret_secret_id = excluded.client_secret_secret_id,
      api_key_secret_id = excluded.api_key_secret_id,
      config = case
        when excluded.config = '{}'::jsonb then private.automation_integration_credentials.config
        else excluded.config
      end,
      updated_by = excluded.updated_by,
      updated_at = now();

  insert into public.automation_connection_events(provider_key,actor_id,event_type,detail)
  select provider_key,p_actor_id,'credentials_saved',
    jsonb_build_object('integration_key',p_integration_key)
  from public.automation_connections
  where integration_key = p_integration_key
  order by provider_key
  limit 1;

  return true;
end;
$$;

revoke all on function public.ops_upsert_integration_credentials(text,text,text,text,jsonb,uuid)
  from public, anon, authenticated;
grant execute on function public.ops_upsert_integration_credentials(text,text,text,text,jsonb,uuid)
  to service_role;

create or replace function public.ops_get_integration_credentials(p_integration_key text)
returns table(
  integration_key text,
  client_id text,
  client_secret text,
  api_key text,
  config jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.integration_key,
    client_id.decrypted_secret,
    client_secret.decrypted_secret,
    api_key.decrypted_secret,
    c.config
  from private.automation_integration_credentials c
  left join vault.decrypted_secrets client_id on client_id.id = c.client_id_secret_id
  left join vault.decrypted_secrets client_secret on client_secret.id = c.client_secret_secret_id
  left join vault.decrypted_secrets api_key on api_key.id = c.api_key_secret_id
  where c.integration_key = p_integration_key;
$$;

revoke all on function public.ops_get_integration_credentials(text)
  from public, anon, authenticated;
grant execute on function public.ops_get_integration_credentials(text)
  to service_role;

create or replace function public.ops_get_integration_readiness()
returns table(
  integration_key text,
  has_client_id boolean,
  has_client_secret boolean,
  has_api_key boolean,
  config jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.integration_key,
    c.client_id_secret_id is not null,
    c.client_secret_secret_id is not null,
    c.api_key_secret_id is not null,
    c.config,
    c.updated_at
  from private.automation_integration_credentials c
  order by c.integration_key;
$$;

revoke all on function public.ops_get_integration_readiness()
  from public, anon, authenticated;
grant execute on function public.ops_get_integration_readiness()
  to service_role;

create or replace function public.ops_issue_oauth_state(
  p_state_hash text,
  p_integration_key text,
  p_provider_key text,
  p_actor_id uuid,
  p_code_verifier text,
  p_redirect_to text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_verifier_id uuid;
begin
  if not (select private.is_fmb_connection_owner(p_actor_id)) then
    raise exception using errcode='42501', message='FMB owner access is required';
  end if;
  if p_integration_key not in ('meta','google','linkedin','canva','github')
     or not exists (
       select 1
       from public.automation_connections
       where provider_key = p_provider_key
         and integration_key = p_integration_key
     ) then
    raise exception using errcode='22023', message='Provider does not match its integration';
  end if;
  if p_state_hash !~ '^[A-Za-z0-9_-]{40,100}$'
     or char_length(p_code_verifier) not between 43 and 128
     or char_length(p_redirect_to) not between 8 and 1000 then
    raise exception using errcode='22023', message='OAuth state is invalid';
  end if;

  for v_verifier_id in
    delete from private.automation_oauth_states
    where expires_at <= now()
    returning code_verifier_secret_id
  loop
    perform private.delete_fmb_vault_secret(v_verifier_id);
  end loop;

  v_verifier_id := vault.create_secret(
    p_code_verifier,
    'fmb/oauth-verifier/' || gen_random_uuid()::text,
    'Short-lived FMB OAuth PKCE verifier'
  );

  insert into private.automation_oauth_states(
    state_hash,integration_key,provider_key,owner_id,
    code_verifier_secret_id,redirect_to,expires_at
  ) values (
    p_state_hash,p_integration_key,p_provider_key,p_actor_id,
    v_verifier_id,p_redirect_to,now() + interval '10 minutes'
  );

  update public.automation_connections
  set status = 'authorizing',
      last_error = null,
      updated_at = now()
  where integration_key = p_integration_key
    and status <> 'connected_api';

  insert into public.automation_connection_events(provider_key,actor_id,event_type,detail)
  values (
    p_provider_key,p_actor_id,'authorization_started',
    jsonb_build_object('integration_key',p_integration_key)
  );

  return true;
end;
$$;

revoke all on function public.ops_issue_oauth_state(text,text,text,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.ops_issue_oauth_state(text,text,text,uuid,text,text)
  to service_role;

create or replace function public.ops_consume_oauth_state(p_state_hash text)
returns table(
  integration_key text,
  provider_key text,
  owner_id uuid,
  code_verifier text,
  redirect_to text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_state private.automation_oauth_states;
  v_verifier text;
begin
  select * into v_state
  from private.automation_oauth_states s
  where s.state_hash = p_state_hash
  for update;

  if not found then
    return;
  end if;

  select decrypted_secret into v_verifier
  from vault.decrypted_secrets
  where id = v_state.code_verifier_secret_id;

  delete from private.automation_oauth_states
  where state_hash = p_state_hash;
  perform private.delete_fmb_vault_secret(v_state.code_verifier_secret_id);

  if v_state.expires_at <= now() or v_verifier is null then
    return;
  end if;

  return query
  select
    v_state.integration_key,
    v_state.provider_key,
    v_state.owner_id,
    v_verifier,
    v_state.redirect_to;
end;
$$;

revoke all on function public.ops_consume_oauth_state(text)
  from public, anon, authenticated;
grant execute on function public.ops_consume_oauth_state(text)
  to service_role;

create or replace function public.ops_store_provider_token(
  p_provider_key text,
  p_actor_id uuid,
  p_access_token text,
  p_refresh_token text,
  p_token_type text,
  p_scopes text[],
  p_expires_at timestamptz,
  p_external_account_id text,
  p_external_account_label text,
  p_metadata jsonb,
  p_verification_note text,
  p_management_url text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_existing private.automation_provider_tokens;
  v_access_id uuid;
  v_refresh_id uuid;
  v_metadata jsonb := coalesce(p_metadata,'{}'::jsonb);
begin
  if not (select private.is_fmb_connection_owner(p_actor_id)) then
    raise exception using errcode='42501', message='FMB owner access is required';
  end if;
  if nullif(p_access_token,'') is null
     or not exists (
       select 1 from public.automation_connections
       where provider_key = p_provider_key
     ) then
    raise exception using errcode='22023', message='A valid provider token is required';
  end if;
  if jsonb_typeof(v_metadata) is distinct from 'object'
     or octet_length(v_metadata::text) > 20000 then
    raise exception using errcode='22023', message='Provider metadata is invalid';
  end if;

  perform pg_advisory_xact_lock(hashtext('fmb-provider-token:' || p_provider_key));

  select * into v_existing
  from private.automation_provider_tokens
  where provider_key = p_provider_key
  for update;

  v_access_id := private.upsert_fmb_vault_secret(
    v_existing.access_token_secret_id,
    p_access_token,
    'fmb/' || p_provider_key || '/access-token',
    'FMB Automation Center provider access token'
  );
  v_refresh_id := private.upsert_fmb_vault_secret(
    v_existing.refresh_token_secret_id,
    nullif(p_refresh_token,''),
    'fmb/' || p_provider_key || '/refresh-token',
    'FMB Automation Center provider refresh token'
  );

  insert into private.automation_provider_tokens(
    provider_key,access_token_secret_id,refresh_token_secret_id,
    token_type,scopes,expires_at,external_account_id,
    external_account_label,metadata,connected_by
  ) values (
    p_provider_key,v_access_id,v_refresh_id,
    left(coalesce(nullif(p_token_type,''),'Bearer'),30),
    coalesce(p_scopes,'{}'::text[]),p_expires_at,
    nullif(left(coalesce(p_external_account_id,''),300),''),
    nullif(left(coalesce(p_external_account_label,''),300),''),
    v_metadata,p_actor_id
  )
  on conflict (provider_key) do update
  set access_token_secret_id = excluded.access_token_secret_id,
      refresh_token_secret_id = coalesce(
        excluded.refresh_token_secret_id,
        private.automation_provider_tokens.refresh_token_secret_id
      ),
      token_type = excluded.token_type,
      scopes = excluded.scopes,
      expires_at = excluded.expires_at,
      external_account_id = excluded.external_account_id,
      external_account_label = excluded.external_account_label,
      metadata = excluded.metadata,
      connected_by = excluded.connected_by,
      updated_at = now();

  update public.automation_connections
  set status = 'connected_api',
      account_label = nullif(left(coalesce(p_external_account_label,''),180),''),
      external_account_id = nullif(left(coalesce(p_external_account_id,''),300),''),
      granted_scopes = coalesce(p_scopes,'{}'::text[]),
      management_url = nullif(left(coalesce(p_management_url,''),1000),''),
      verification_note = nullif(left(coalesce(p_verification_note,''),2000),''),
      verified_at = now(),
      verified_by = p_actor_id,
      last_checked_at = now(),
      last_error = null,
      updated_at = now()
  where provider_key = p_provider_key;

  insert into public.automation_connection_events(provider_key,actor_id,event_type,detail)
  values (
    p_provider_key,p_actor_id,
    case when v_existing.provider_key is null then 'connected' else 'verified' end,
    jsonb_build_object(
      'account_label',nullif(left(coalesce(p_external_account_label,''),180),''),
      'scope_count',coalesce(array_length(p_scopes,1),0)
    )
  );

  return true;
end;
$$;

revoke all on function public.ops_store_provider_token(text,uuid,text,text,text,text[],timestamptz,text,text,jsonb,text,text)
  from public, anon, authenticated;
grant execute on function public.ops_store_provider_token(text,uuid,text,text,text,text[],timestamptz,text,text,jsonb,text,text)
  to service_role;

create or replace function public.ops_get_provider_token(p_provider_key text)
returns table(
  provider_key text,
  access_token text,
  refresh_token text,
  token_type text,
  scopes text[],
  expires_at timestamptz,
  external_account_id text,
  external_account_label text,
  metadata jsonb,
  connected_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.provider_key,
    access_token.decrypted_secret,
    refresh_token.decrypted_secret,
    t.token_type,
    t.scopes,
    t.expires_at,
    t.external_account_id,
    t.external_account_label,
    t.metadata,
    t.connected_by
  from private.automation_provider_tokens t
  join vault.decrypted_secrets access_token on access_token.id = t.access_token_secret_id
  left join vault.decrypted_secrets refresh_token on refresh_token.id = t.refresh_token_secret_id
  where t.provider_key = p_provider_key;
$$;

revoke all on function public.ops_get_provider_token(text)
  from public, anon, authenticated;
grant execute on function public.ops_get_provider_token(text)
  to service_role;

create or replace function public.ops_mark_provider_error(
  p_provider_key text,
  p_actor_id uuid,
  p_error text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not (select private.is_fmb_connection_owner(p_actor_id)) then
    raise exception using errcode='42501', message='FMB owner access is required';
  end if;

  update public.automation_connections
  set status = 'error',
      last_error = left(coalesce(nullif(trim(p_error),''),'Connection verification failed.'),2000),
      last_checked_at = now(),
      updated_at = now()
  where provider_key = p_provider_key;

  if not found then
    raise exception using errcode='P0002', message='Provider was not found';
  end if;

  insert into public.automation_connection_events(provider_key,actor_id,event_type,detail)
  values (
    p_provider_key,p_actor_id,'connection_error',
    jsonb_build_object('message',left(coalesce(nullif(trim(p_error),''),'Connection verification failed.'),500))
  );

  return true;
end;
$$;

revoke all on function public.ops_mark_provider_error(text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.ops_mark_provider_error(text,uuid,text)
  to service_role;

create or replace function public.ops_disconnect_provider(
  p_provider_key text,
  p_actor_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token private.automation_provider_tokens;
begin
  if not (select private.is_fmb_connection_owner(p_actor_id)) then
    raise exception using errcode='42501', message='FMB owner access is required';
  end if;

  select * into v_token
  from private.automation_provider_tokens
  where provider_key = p_provider_key
  for update;

  if found then
    delete from private.automation_provider_tokens
    where provider_key = p_provider_key;
    perform private.delete_fmb_vault_secret(v_token.access_token_secret_id);
    perform private.delete_fmb_vault_secret(v_token.refresh_token_secret_id);
  end if;

  update public.automation_connections
  set status = 'setup_required',
      account_label = null,
      external_account_id = null,
      granted_scopes = '{}'::text[],
      verification_note = null,
      verified_at = null,
      verified_by = null,
      last_checked_at = now(),
      last_error = null,
      updated_at = now()
  where provider_key = p_provider_key
    and integration_key <> 'native';

  if not found then
    raise exception using errcode='P0002', message='Provider was not found or cannot be disconnected';
  end if;

  insert into public.automation_connection_events(provider_key,actor_id,event_type,detail)
  values (p_provider_key,p_actor_id,'disconnected','{}'::jsonb);

  return true;
end;
$$;

revoke all on function public.ops_disconnect_provider(text,uuid)
  from public, anon, authenticated;
grant execute on function public.ops_disconnect_provider(text,uuid)
  to service_role;

insert into public.automation_connections(
  provider_key,display_name,integration_key,connection_type,status,
  account_label,capabilities,management_url,verification_note,
  verified_at,last_checked_at
)
values
  (
    'facebook_page','Facebook Page','meta','oauth','setup_required',null,
    array['Posts','Comments','Page insights'],
    'https://developers.facebook.com/apps/',null,null,null
  ),
  (
    'instagram_business','Instagram Business','meta','oauth','setup_required',null,
    array['Posts','Reels','Comments','Insights'],
    'https://developers.facebook.com/apps/',null,null,null
  ),
  (
    'messenger','Messenger','meta','webhook','setup_required',null,
    array['Message intake','Question routing','Human handoff'],
    'https://developers.facebook.com/apps/',null,null,null
  ),
  (
    'linkedin_page','LinkedIn Page','linkedin','oauth','setup_required',null,
    array['Company posts','Performance evidence'],
    'https://www.linkedin.com/developers/apps',null,null,null
  ),
  (
    'youtube_channel','YouTube Channel','google','oauth','setup_required',null,
    array['Videos','Comments','Analytics'],
    'https://console.cloud.google.com/apis/credentials',null,null,null
  ),
  (
    'canva','Canva','canva','oauth','setup_required',null,
    array['Design handoff','Creative links','Approval evidence'],
    'https://www.canva.com/developers/integrations',null,null,null
  ),
  (
    'google_drive','Google Drive','google','oauth','setup_required',null,
    array['Source files','Deliverables','Evidence files'],
    'https://console.cloud.google.com/apis/credentials',null,null,null
  ),
  (
    'gmail','Gmail','google','oauth','setup_required',null,
    array['Approved email handoff','Inquiry routing'],
    'https://console.cloud.google.com/apis/credentials',null,null,null
  ),
  (
    'github','GitHub','github','oauth','setup_required',null,
    array['Repository work','Issue handoff','Release evidence'],
    'https://github.com/settings/developers',null,null,null
  ),
  (
    'chatgpt_handoff','OpenAI API for ChatGPT and Codex handoff','openai','api','setup_required',null,
    array['Instruction intake','Research handoff','Human approval queue'],
    'https://platform.openai.com/settings/organization/api-keys',null,null,null
  )
on conflict (provider_key) do update
set integration_key = excluded.integration_key,
    connection_type = excluded.connection_type,
    capabilities = excluded.capabilities,
    management_url = coalesce(public.automation_connections.management_url,excluded.management_url),
    updated_at = now();

update public.automation_connections
set integration_key = 'native'
where provider_key in ('main_website','supabase_workspace');

notify pgrst, 'reload schema';
