alter table public.news_sources
  alter column auto_publish set default true;

alter table public.news_articles
  add column if not exists filipino_impact text,
  add column if not exists affected_groups text[] not null default '{}',
  add column if not exists household_impact text,
  add column if not exists public_interest_action text,
  add column if not exists fmb_perspective text,
  add column if not exists impact_confidence text not null default 'low',
  add column if not exists editorial_lens_version text not null default 'fmb_filipino_first_v1',
  add column if not exists auto_published boolean not null default false,
  add column if not exists requires_review_reason text;

alter table public.news_articles
  drop constraint if exists news_articles_impact_confidence_check;

alter table public.news_articles
  add constraint news_articles_impact_confidence_check
  check (impact_confidence in ('low','medium','high'));

alter table public.news_articles
  drop constraint if exists news_articles_published_filipino_lens_check;

alter table public.news_articles
  add constraint news_articles_published_filipino_lens_check
  check (
    status <> 'published'
    or (
      char_length(trim(coalesce(filipino_impact, ''))) >= 40
      and cardinality(affected_groups) >= 1
      and char_length(trim(coalesce(household_impact, ''))) >= 20
      and char_length(trim(coalesce(public_interest_action, ''))) >= 20
      and char_length(trim(coalesce(fmb_perspective, ''))) >= 40
      and impact_confidence in ('medium','high')
    )
  );

alter table public.news_articles
  drop constraint if exists news_articles_high_risk_human_review_check;

alter table public.news_articles
  add constraint news_articles_high_risk_human_review_check
  check (
    status <> 'published'
    or risk_level <> 'high'
    or (reviewed_by is not null and reviewed_at is not null)
  );

create index if not exists news_articles_auto_published_idx
  on public.news_articles (auto_published, published_at desc)
  where status = 'published';

comment on column public.news_articles.filipino_impact is 'Required plain-language answer to what the story means for Filipinos.';
comment on column public.news_articles.affected_groups is 'Groups of Filipinos likely to feel the effect, including low-income and vulnerable communities when relevant.';
comment on column public.news_articles.household_impact is 'Likely effect on daily life, income, prices, services, safety, rights, or opportunities.';
comment on column public.news_articles.public_interest_action is 'What Filipinos should watch, verify, prepare for, or ask next.';
comment on column public.news_articles.fmb_perspective is 'Filipino-first, class-inclusive, non-partisan FMB editorial perspective focused on public outcomes rather than personalities.';
comment on column public.news_articles.impact_confidence is 'Confidence that the Filipino impact analysis is supported by the supplied source material.';
