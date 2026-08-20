create extension if not exists pgcrypto;

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  homepage_url text,
  source_type text not null default 'rss' check (source_type in ('rss','atom','json_feed')),
  category text not null default 'Philippines',
  region text,
  active boolean not null default true,
  auto_publish boolean not null default false,
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high')),
  rights_note text,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  etag text,
  last_modified text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_sources(id) on delete set null,
  source_item_id text,
  source_url text not null unique,
  source_name text not null,
  title text not null,
  slug text not null unique,
  source_excerpt text,
  summary text,
  body text,
  category text not null default 'Philippines',
  region text,
  author_line text,
  image_url text,
  image_credit text,
  status text not null default 'pending_review' check (status in ('pending_review','published','rejected','needs_correction')),
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high')),
  verification_status text not null default 'imported' check (verification_status in ('imported','verified','corrected')),
  is_ai_assisted boolean not null default false,
  seo_title text,
  seo_description text,
  source_published_at timestamptz,
  published_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_item_id)
);

create index if not exists news_articles_public_feed_idx on public.news_articles (published_at desc) where status = 'published';
create index if not exists news_articles_review_queue_idx on public.news_articles (status, created_at desc);
create index if not exists news_sources_active_idx on public.news_sources (active, last_checked_at);
create index if not exists news_articles_reviewed_by_idx on public.news_articles (reviewed_by) where reviewed_by is not null;
create index if not exists news_sources_created_by_idx on public.news_sources (created_by) where created_by is not null;

create table if not exists public.news_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null default 'cron' check (trigger_type in ('cron','manual')),
  status text not null default 'running' check (status in ('running','completed','partial','failed')),
  sources_checked integer not null default 0,
  items_seen integer not null default 0,
  items_imported integer not null default 0,
  items_published integer not null default 0,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.news_sources enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_ingestion_runs enable row level security;

revoke all on public.news_sources from anon;
revoke all on public.news_ingestion_runs from anon;
revoke all on public.news_articles from anon;
revoke all on public.news_sources from authenticated;
revoke all on public.news_articles from authenticated;
revoke all on public.news_ingestion_runs from authenticated;

grant select on public.news_articles to anon;
grant select, insert, update, delete on public.news_sources to authenticated;
grant select, insert, update, delete on public.news_articles to authenticated;
grant select on public.news_ingestion_runs to authenticated;

drop policy if exists "news published read anon" on public.news_articles;
create policy "news published read anon" on public.news_articles
for select to anon
using (status = 'published');

drop policy if exists "news readable authenticated" on public.news_articles;
create policy "news readable authenticated" on public.news_articles
for select to authenticated
using (status = 'published' or (select private.is_fmb_staff()));

drop policy if exists "news admin insert" on public.news_articles;
create policy "news admin insert" on public.news_articles
for insert to authenticated
with check ((select private.is_fmb_admin()));

drop policy if exists "news admin update" on public.news_articles;
create policy "news admin update" on public.news_articles
for update to authenticated
using ((select private.is_fmb_admin()))
with check ((select private.is_fmb_admin()));

drop policy if exists "news admin delete" on public.news_articles;
create policy "news admin delete" on public.news_articles
for delete to authenticated
using ((select private.is_fmb_admin()));

drop policy if exists "news sources staff read" on public.news_sources;
create policy "news sources staff read" on public.news_sources
for select to authenticated
using ((select private.is_fmb_staff()));

drop policy if exists "news sources admin insert" on public.news_sources;
create policy "news sources admin insert" on public.news_sources
for insert to authenticated
with check ((select private.is_fmb_admin()));

drop policy if exists "news sources admin update" on public.news_sources;
create policy "news sources admin update" on public.news_sources
for update to authenticated
using ((select private.is_fmb_admin()))
with check ((select private.is_fmb_admin()));

drop policy if exists "news sources admin delete" on public.news_sources;
create policy "news sources admin delete" on public.news_sources
for delete to authenticated
using ((select private.is_fmb_admin()));

drop policy if exists "news runs staff read" on public.news_ingestion_runs;
create policy "news runs staff read" on public.news_ingestion_runs
for select to authenticated
using ((select private.is_fmb_staff()));

comment on table public.news_sources is 'Approved external feeds used by the FMB News ingestion system.';
comment on table public.news_articles is 'Imported and human-reviewed FMB News items. Only published rows are public.';
comment on table public.news_ingestion_runs is 'Audit history for scheduled and manual newsroom ingestion runs.';
