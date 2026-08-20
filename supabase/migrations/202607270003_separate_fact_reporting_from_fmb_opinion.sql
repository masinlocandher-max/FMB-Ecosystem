alter table public.news_articles
  add column if not exists story_type text not null default 'news',
  add column if not exists perspective_status text not null default 'none';

alter table public.news_articles
  drop constraint if exists news_articles_story_type_check;

alter table public.news_articles
  add constraint news_articles_story_type_check
  check (story_type in ('news','advisory','explainer','analysis','opinion'));

alter table public.news_articles
  drop constraint if exists news_articles_perspective_status_check;

alter table public.news_articles
  add constraint news_articles_perspective_status_check
  check (perspective_status in ('none','draft','approved'));

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
      and impact_confidence in ('medium','high')
      and (
        story_type in ('news','advisory','explainer')
        or (
          story_type in ('analysis','opinion')
          and perspective_status = 'approved'
          and char_length(trim(coalesce(fmb_perspective, ''))) >= 40
          and reviewed_by is not null
          and reviewed_at is not null
        )
      )
    )
  );

update public.news_articles
set story_type = 'news',
    perspective_status = case
      when char_length(trim(coalesce(fmb_perspective, ''))) >= 40 then 'draft'
      else 'none'
    end
where story_type is null or perspective_status is null;

comment on column public.news_articles.story_type is 'News, advisory, and explainer may publish automatically. Analysis and opinion require approved human-authored perspective.';
comment on column public.news_articles.perspective_status is 'FMB perspective is absent by default and must be explicitly approved for analysis or opinion.';
