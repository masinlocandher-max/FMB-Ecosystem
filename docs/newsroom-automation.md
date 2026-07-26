# FMB Newsroom Automation

This system adds an automated collection and controlled publishing layer to FMB News without replacing its curated reporting.

## Publishing flow

1. An administrator adds an approved RSS, Atom, or JSON Feed in the private FMB&CO. Orchestrator.
2. `/api/news/ingest` checks active feeds and imports only the title, source URL, feed excerpt, publication date, byline, and feed-provided image URL.
3. Imported items default to `pending_review`.
4. Sources may be allowed to auto-publish only when their default risk is `low`.
5. Crime, politics, elections, allegations, health, legal disputes, deaths, violence, and similar sensitive language are escalated to `high` risk and cannot auto-publish.
6. Published rows appear in the live desk on `/news/` and open as source-attributed briefs at `/news/story.html?slug=...`.
7. FMB News links readers to the original report and does not reproduce the source article in full.

## Required Vercel environment variables

Set these only in Vercel project settings. Never commit their values.

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (recommended) or `SUPABASE_SERVICE_ROLE_KEY` (legacy fallback)
- `SUPABASE_PUBLISHABLE_KEY` (recommended) or `SUPABASE_ANON_KEY` (legacy fallback, needed to validate an administrator session)
- `CRON_SECRET`

Optional:

- `OPENAI_API_KEY` enables a neutral two-to-three-sentence draft summary based only on feed-provided text.
- `NEWS_SUMMARY_MODEL` defaults to `gpt-5-mini`.
- `NEWS_ADMIN_TOKEN` is an emergency manual-trigger fallback. Normal manual imports use the signed-in Supabase administrator session.

## Cron schedule

The production Vercel configuration calls `/api/news/ingest` once daily at `00:15 UTC`, which is `08:15 Asia/Manila`. This schedule works on Vercel Hobby limits. On a paid Vercel plan, it can be changed to hourly after source quality and cost are reviewed.

## Database objects

The production Supabase project contains:

- `news_sources`
- `news_articles`
- `news_ingestion_runs`

RLS rules expose only `published` news articles publicly. Source configuration, pending stories, rejected items, correction states, and ingestion history remain available only to authorized FMB staff. Writes from the browser require the existing FMB administrator role.

## First launch checklist

1. Add one to three official feeds, with auto-publish turned off.
2. Select **Run import now**.
3. Review summaries against the original source.
4. Publish only accurate, rights-safe briefs.
5. Keep politics, crime, health, accusations, and private-person stories in manual review.
6. Enable low-risk auto-publishing only after several successful imports from the same source.
