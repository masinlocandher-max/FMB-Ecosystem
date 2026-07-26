-- FMB&CO. Operations Command Center
-- Persistent instructions, assignments, connection records, evidence, approvals,
-- and an immutable activity trail for the private data subdomain.

create table if not exists public.automation_connections (
  provider_key text primary key
    check (provider_key ~ '^[a-z0-9][a-z0-9_-]{1,79}$'),
  display_name text not null
    check (char_length(display_name) between 2 and 120),
  connection_type text not null default 'manual'
    check (connection_type in ('manual','oauth','webhook','api','native')),
  status text not null default 'setup_required'
    check (status in ('setup_required','authorizing','verified_manual','connected_api','paused','error')),
  account_label text,
  capabilities text[] not null default '{}'::text[],
  management_url text,
  verification_note text,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  last_checked_at timestamptz,
  last_error text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (account_label is null or char_length(account_label) <= 180),
  check (management_url is null or char_length(management_url) <= 1000),
  check (verification_note is null or char_length(verification_note) <= 2000),
  check (last_error is null or char_length(last_error) <= 2000)
);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  title text not null check (char_length(title) between 3 and 220),
  instruction text not null check (char_length(instruction) between 10 and 8000),
  success_definition text not null check (char_length(success_definition) between 5 and 4000),
  brand text not null default 'FMB&CO.'
    check (brand in ('FMB&CO.','SENZ','With Love, FMB','Yoni','Cognita','Mabayani')),
  channels text[] not null default '{}'::text[]
    check (coalesce(array_length(channels,1),0) <= 12),
  task_type text not null default 'content'
    check (task_type in ('content','community','campaign','website','research','reply','analytics','administration','other')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  status text not null default 'draft'
    check (status in ('draft','assigned','acknowledged','in_progress','blocked','submitted','changes_requested','approved','cancelled')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  source_plan_ref text,
  target_url text,
  due_at timestamptz,
  approval_required boolean not null default true check (approval_required),
  evidence_required boolean not null default true,
  completion_notes text,
  block_reason text,
  review_note text,
  acknowledged_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_plan_ref is null or char_length(source_plan_ref) <= 180),
  check (target_url is null or char_length(target_url) <= 1000),
  check (completion_notes is null or char_length(completion_notes) <= 4000),
  check (block_reason is null or char_length(block_reason) <= 2000),
  check (review_note is null or char_length(review_note) <= 2000),
  check (status = 'draft' or assigned_to is not null)
);

create table if not exists public.work_evidence (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  evidence_type text not null default 'link'
    check (evidence_type in ('link','screenshot','file','analytics','note','published_post')),
  title text not null check (char_length(title) between 2 and 180),
  description text,
  evidence_url text,
  storage_path text,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  review_status text not null default 'pending'
    check (review_status in ('pending','accepted','rejected')),
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (description is null or char_length(description) <= 4000),
  check (evidence_url is null or char_length(evidence_url) <= 1000),
  check (storage_path is null or char_length(storage_path) <= 1000),
  check (review_note is null or char_length(review_note) <= 2000),
  check (evidence_url is not null or storage_path is not null or description is not null)
);

create table if not exists public.work_order_events (
  id bigint generated always as identity primary key,
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 80),
  from_status text,
  to_status text,
  note text,
  created_at timestamptz not null default now(),
  check (note is null or char_length(note) <= 2000)
);

create index if not exists work_orders_assigned_status_idx
  on public.work_orders(assigned_to,status,due_at);
create index if not exists work_orders_created_idx
  on public.work_orders(created_at desc);
create index if not exists work_evidence_order_created_idx
  on public.work_evidence(work_order_id,created_at desc);
create index if not exists work_evidence_review_idx
  on public.work_evidence(review_status,created_at desc);
create index if not exists work_order_events_order_created_idx
  on public.work_order_events(work_order_id,created_at desc);

create or replace function private.touch_operations_record()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_operations_record() from public, anon;
grant execute on function private.touch_operations_record() to authenticated, service_role;

drop trigger if exists automation_connections_touch_updated_at on public.automation_connections;
create trigger automation_connections_touch_updated_at
before update on public.automation_connections
for each row execute function private.touch_operations_record();

drop trigger if exists work_orders_touch_updated_at on public.work_orders;
create trigger work_orders_touch_updated_at
before update on public.work_orders
for each row execute function private.touch_operations_record();

create or replace function private.capture_work_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event text;
begin
  if tg_op = 'INSERT' then
    v_event := 'created';
    insert into public.work_order_events(
      work_order_id,actor_id,event_type,from_status,to_status
    ) values (
      new.id,(select auth.uid()),v_event,null,new.status
    );
  else
    v_event := case
      when new.status is distinct from old.status then 'status_changed'
      when new.assigned_to is distinct from old.assigned_to then 'assignment_changed'
      else 'instruction_updated'
    end;
    insert into public.work_order_events(
      work_order_id,actor_id,event_type,from_status,to_status
    ) values (
      new.id,(select auth.uid()),v_event,old.status,new.status
    );
  end if;
  return new;
end;
$$;

revoke all on function private.capture_work_order_change() from public, anon, authenticated;
grant execute on function private.capture_work_order_change() to authenticated, service_role;

drop trigger if exists work_orders_capture_change on public.work_orders;
create trigger work_orders_capture_change
after insert or update on public.work_orders
for each row execute function private.capture_work_order_change();

create or replace function private.capture_work_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.work_order_events(
    work_order_id,actor_id,event_type,from_status,to_status,note
  )
  select
    new.work_order_id,
    (select auth.uid()),
    'evidence_added',
    work_orders.status,
    work_orders.status,
    left(new.title,2000)
  from public.work_orders
  where work_orders.id = new.work_order_id;
  return new;
end;
$$;

revoke all on function private.capture_work_evidence() from public, anon, authenticated;
grant execute on function private.capture_work_evidence() to authenticated, service_role;

drop trigger if exists work_evidence_capture_insert on public.work_evidence;
create trigger work_evidence_capture_insert
after insert on public.work_evidence
for each row execute function private.capture_work_evidence();

create or replace function private.transition_work_order_impl(
  p_work_order_id uuid,
  p_status text,
  p_note text default null
)
returns public.work_orders
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text;
  v_order public.work_orders;
  v_note text := nullif(left(trim(coalesce(p_note,'')),2000),'');
  v_allowed boolean := false;
begin
  select role into v_role
  from public.profiles
  where id = v_uid
    and status = 'active'
    and role in ('moderator','admin');

  if v_role is null then
    raise exception using errcode='42501', message='Active FMB staff access is required';
  end if;

  select * into v_order
  from public.work_orders
  where id = p_work_order_id
  for update;

  if not found then
    raise exception using errcode='P0002', message='Work order was not found';
  end if;

  if v_role <> 'admin' and v_order.assigned_to is distinct from v_uid then
    raise exception using errcode='42501', message='This work order is not assigned to the signed-in staff member';
  end if;

  if v_role = 'admin' then
    v_allowed := p_status in (
      'assigned','acknowledged','in_progress','blocked','submitted',
      'changes_requested','approved','cancelled'
    );
  else
    v_allowed := (
      (v_order.status = 'assigned' and p_status in ('acknowledged','blocked'))
      or (v_order.status = 'acknowledged' and p_status in ('in_progress','blocked'))
      or (v_order.status = 'in_progress' and p_status in ('submitted','blocked'))
      or (v_order.status = 'changes_requested' and p_status in ('in_progress','blocked'))
      or (v_order.status = 'blocked' and p_status = 'in_progress')
    );
  end if;

  if not v_allowed then
    raise exception using errcode='22023', message='That work-order transition is not allowed';
  end if;

  if p_status = 'blocked' and v_note is null then
    raise exception using errcode='22023', message='A block reason is required';
  end if;

  if p_status = 'submitted'
     and v_order.evidence_required
     and not exists (
       select 1 from public.work_evidence
       where work_order_id = v_order.id
     ) then
    raise exception using errcode='22023', message='Evidence is required before this work can be submitted';
  end if;

  update public.work_orders
  set
    status = p_status,
    acknowledged_at = case
      when p_status = 'acknowledged' then coalesce(acknowledged_at,now())
      else acknowledged_at
    end,
    started_at = case
      when p_status = 'in_progress' then coalesce(started_at,now())
      else started_at
    end,
    submitted_at = case
      when p_status = 'submitted' then now()
      else submitted_at
    end,
    completion_notes = case
      when p_status = 'submitted' then v_note
      else completion_notes
    end,
    block_reason = case
      when p_status = 'blocked' then v_note
      when p_status <> 'blocked' then null
      else block_reason
    end
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function private.transition_work_order_impl(uuid,text,text)
  from public, anon;
grant execute on function private.transition_work_order_impl(uuid,text,text)
  to authenticated, service_role;

create or replace function public.transition_work_order(
  p_work_order_id uuid,
  p_status text,
  p_note text default null
)
returns public.work_orders
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.transition_work_order_impl(p_work_order_id,p_status,p_note);
$$;

revoke all on function public.transition_work_order(uuid,text,text)
  from public, anon;
grant execute on function public.transition_work_order(uuid,text,text)
  to authenticated, service_role;

create or replace function private.review_work_evidence_impl(
  p_evidence_id uuid,
  p_decision text,
  p_note text default null
)
returns public.work_evidence
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_evidence public.work_evidence;
  v_note text := nullif(left(trim(coalesce(p_note,'')),2000),'');
begin
  if not (select private.is_fmb_admin()) then
    raise exception using errcode='42501', message='Administrator access is required';
  end if;
  if p_decision not in ('accepted','rejected') then
    raise exception using errcode='22023', message='Evidence decision must be accepted or rejected';
  end if;
  if p_decision = 'rejected' and v_note is null then
    raise exception using errcode='22023', message='A rejection note is required';
  end if;

  update public.work_evidence
  set
    review_status = p_decision,
    review_note = v_note,
    reviewed_by = v_uid,
    reviewed_at = now()
  where id = p_evidence_id
  returning * into v_evidence;

  if not found then
    raise exception using errcode='P0002', message='Evidence was not found';
  end if;

  insert into public.work_order_events(
    work_order_id,actor_id,event_type,note
  ) values (
    v_evidence.work_order_id,v_uid,'evidence_' || p_decision,v_note
  );

  return v_evidence;
end;
$$;

revoke all on function private.review_work_evidence_impl(uuid,text,text)
  from public, anon;
grant execute on function private.review_work_evidence_impl(uuid,text,text)
  to authenticated, service_role;

create or replace function public.review_work_evidence(
  p_evidence_id uuid,
  p_decision text,
  p_note text default null
)
returns public.work_evidence
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.review_work_evidence_impl(p_evidence_id,p_decision,p_note);
$$;

revoke all on function public.review_work_evidence(uuid,text,text)
  from public, anon;
grant execute on function public.review_work_evidence(uuid,text,text)
  to authenticated, service_role;

create or replace function private.review_work_order_impl(
  p_work_order_id uuid,
  p_decision text,
  p_note text default null
)
returns public.work_orders
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_order public.work_orders;
  v_note text := nullif(left(trim(coalesce(p_note,'')),2000),'');
begin
  if not (select private.is_fmb_admin()) then
    raise exception using errcode='42501', message='Administrator access is required';
  end if;
  if p_decision not in ('approved','changes_requested') then
    raise exception using errcode='22023', message='Review decision must be approved or changes_requested';
  end if;
  if p_decision = 'changes_requested' and v_note is null then
    raise exception using errcode='22023', message='Revision instructions are required';
  end if;

  select * into v_order
  from public.work_orders
  where id = p_work_order_id
  for update;

  if not found then
    raise exception using errcode='P0002', message='Work order was not found';
  end if;
  if v_order.status <> 'submitted' then
    raise exception using errcode='22023', message='Only submitted work can be reviewed';
  end if;
  if p_decision = 'approved'
     and v_order.evidence_required
     and not exists (
       select 1 from public.work_evidence
       where work_order_id = v_order.id
         and review_status = 'accepted'
     ) then
    raise exception using errcode='22023', message='Accept at least one evidence item before approving the work';
  end if;

  update public.work_orders
  set
    status = p_decision,
    review_note = v_note,
    approved_by = case when p_decision = 'approved' then v_uid else null end,
    approved_at = case when p_decision = 'approved' then now() else null end
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function private.review_work_order_impl(uuid,text,text)
  from public, anon;
grant execute on function private.review_work_order_impl(uuid,text,text)
  to authenticated, service_role;

create or replace function public.review_work_order(
  p_work_order_id uuid,
  p_decision text,
  p_note text default null
)
returns public.work_orders
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.review_work_order_impl(p_work_order_id,p_decision,p_note);
$$;

revoke all on function public.review_work_order(uuid,text,text)
  from public, anon;
grant execute on function public.review_work_order(uuid,text,text)
  to authenticated, service_role;

alter table public.automation_connections enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_evidence enable row level security;
alter table public.work_order_events enable row level security;

drop policy if exists "connections staff read" on public.automation_connections;
create policy "connections staff read"
on public.automation_connections for select to authenticated
using ((select private.is_fmb_staff()));

drop policy if exists "connections admin insert" on public.automation_connections;
create policy "connections admin insert"
on public.automation_connections for insert to authenticated
with check (
  (select private.is_fmb_admin())
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists "connections admin update" on public.automation_connections;
create policy "connections admin update"
on public.automation_connections for update to authenticated
using ((select private.is_fmb_admin()))
with check ((select private.is_fmb_admin()));

drop policy if exists "work orders staff read" on public.work_orders;
create policy "work orders staff read"
on public.work_orders for select to authenticated
using ((select private.is_fmb_staff()));

drop policy if exists "work orders admin insert" on public.work_orders;
create policy "work orders admin insert"
on public.work_orders for insert to authenticated
with check (
  (select private.is_fmb_admin())
  and created_by = (select auth.uid())
);

drop policy if exists "work orders admin update" on public.work_orders;
create policy "work orders admin update"
on public.work_orders for update to authenticated
using ((select private.is_fmb_admin()))
with check ((select private.is_fmb_admin()));

drop policy if exists "work evidence staff read" on public.work_evidence;
create policy "work evidence staff read"
on public.work_evidence for select to authenticated
using ((select private.is_fmb_staff()));

drop policy if exists "work evidence assignee insert" on public.work_evidence;
create policy "work evidence assignee insert"
on public.work_evidence for insert to authenticated
with check (
  (select private.is_fmb_staff())
  and submitted_by = (select auth.uid())
  and exists (
    select 1 from public.work_orders
    where work_orders.id = work_order_id
      and (
        work_orders.assigned_to = (select auth.uid())
        or (select private.is_fmb_admin())
      )
  )
);

drop policy if exists "work evidence admin update" on public.work_evidence;
create policy "work evidence admin update"
on public.work_evidence for update to authenticated
using ((select private.is_fmb_admin()))
with check ((select private.is_fmb_admin()));

drop policy if exists "work evidence admin delete" on public.work_evidence;
create policy "work evidence admin delete"
on public.work_evidence for delete to authenticated
using ((select private.is_fmb_admin()));

drop policy if exists "work events staff read" on public.work_order_events;
create policy "work events staff read"
on public.work_order_events for select to authenticated
using ((select private.is_fmb_staff()));

revoke all on public.automation_connections from public, anon, authenticated;
revoke all on public.work_orders from public, anon, authenticated;
revoke all on public.work_evidence from public, anon, authenticated;
revoke all on public.work_order_events from public, anon, authenticated;

grant select,insert,update on public.automation_connections to authenticated;
grant select,insert,update on public.work_orders to authenticated;
grant select,insert,update,delete on public.work_evidence to authenticated;
grant select on public.work_order_events to authenticated;
grant usage,select on sequence public.work_orders_ticket_number_seq to authenticated;

insert into storage.buckets(
  id,name,public,file_size_limit,allowed_mime_types
) values (
  'work-evidence',
  'work-evidence',
  false,
  26214400,
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf','text/plain','video/mp4','video/quicktime'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "work evidence files staff read" on storage.objects;
create policy "work evidence files staff read"
on storage.objects for select to authenticated
using (
  bucket_id = 'work-evidence'
  and (select private.is_fmb_staff())
);

drop policy if exists "work evidence files assignee insert" on storage.objects;
create policy "work evidence files assignee insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'work-evidence'
  and (select private.is_fmb_staff())
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "work evidence files owner or admin delete" on storage.objects;
create policy "work evidence files owner or admin delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'work-evidence'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or (select private.is_fmb_admin())
  )
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'work_orders'
    ) then
      alter publication supabase_realtime add table public.work_orders;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'work_evidence'
    ) then
      alter publication supabase_realtime add table public.work_evidence;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'automation_connections'
    ) then
      alter publication supabase_realtime add table public.automation_connections;
    end if;
  end if;
end;
$$;

insert into public.automation_connections(
  provider_key,display_name,connection_type,status,account_label,
  capabilities,verification_note,verified_at,last_checked_at
) values
  (
    'supabase_workspace',
    'Supabase operations database',
    'native',
    'connected_api',
    'withlovefmb',
    array['Authentication','Instructions','Assignments','Evidence','Approvals','Realtime'],
    'Database read and write access verified during the command-center migration.',
    now(),
    now()
  ),
  (
    'main_website',
    'Official FMB website',
    'native',
    'connected_api',
    'www.francinemariebautista.com',
    array['Public route checks','Website task targets','Publication evidence'],
    'Production domain and command-center routing verified during deployment.',
    now(),
    now()
  )
on conflict (provider_key) do update set
  display_name = excluded.display_name,
  connection_type = excluded.connection_type,
  status = excluded.status,
  account_label = excluded.account_label,
  capabilities = excluded.capabilities,
  verification_note = excluded.verification_note,
  verified_at = excluded.verified_at,
  last_checked_at = excluded.last_checked_at,
  updated_at = now();
