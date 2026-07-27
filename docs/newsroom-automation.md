# FMB Newsroom Automation

This system adds automated collection and safeguard-based publishing to FMB News while preserving a clear Filipino-first editorial standard.

## Base story structure

Every public story must contain:

1. **What happened**: a neutral, source-bound summary.
2. **What this means for Filipinos**: a direct explanation of the practical public impact.
3. **Who may feel it most**: affected Filipino groups supported by the source.
4. **Effect on everyday life**: possible effects on expenses, income, work, services, safety, rights, time, or opportunity.
5. **What Filipinos should watch next**: useful questions, verification points, preparations, or public-interest actions.
6. **FMB Perspective**: Filipino-first, class-inclusive, and non-partisan. It centers ordinary Filipinos across income levels, especially poor and vulnerable communities when relevant. It evaluates outcomes, not political personalities.

The database prevents publication when these required sections are missing, too weak, or supported only with low confidence.

## Publishing flow

1. An administrator approves an official RSS, Atom, or JSON Feed in the private FMB&CO. Orchestrator.
2. `/api/news/ingest` checks active feeds and imports the title, source URL, feed excerpt, publication date, byline, and feed-provided image URL.
3. The system creates the complete Filipino-first story structure using only the supplied source material.
4. New approved sources default to automatic publishing.
5. A story publishes automatically when:
   - the source allows automatic publishing;
   - the story is not classified as high risk;
   - all Filipino-first sections are complete;
   - the impact analysis has medium or high confidence.
6. Crime, politics, elections, allegations, health, legal disputes, deaths, violence, private-person stories, weak evidence, and low-confidence impact analysis stop in the exception queue.
7. High-risk stories cannot publish without a named administrator review.
8. Published rows appear on `/news/` and open as source-attributed briefs at `/news/story.html?slug=...`.
9. FMB News links readers to the original report and does not reproduce the source article in full.

## FMB Perspective rules

The automated editorial perspective must:

- ask how the story affects Filipinos, not how it affects a politician's image;
- consider poor, working-class, rural, geographically isolated, disabled, elderly, and otherwise vulnerable Filipinos when relevant;
- avoid treating wealthy or highly connected Filipinos as the default public;
- evaluate access, affordability, dignity, safety, rights, opportunity, and accountability;
- avoid endorsements, attacks, campaign language, personality worship, and partisan framing;
- state uncertainty when the supplied source does not establish an impact.

## Required Vercel environment variables

Set these only in Vercel project settings. Never commit their values.

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (recommended) or `SUPABASE_SERVICE_ROLE_KEY` (legacy fallback)
- `SUPABASE_PUBLISHABLE_KEY` (recommended) or `SUPABASE_ANON_KEY` (legacy fallback, needed to validate an administrator session)
- `CRON_SECRET`
- `OPENAI_API_KEY` (required for automatic Filipino-first drafting and automatic publication)

Optional:

- `NEWS_SUMMARY_MODEL` defaults to `gpt-5-mini`.
- `NEWS_ADMIN_TOKEN` is an emergency manual-trigger fallback. Normal manual imports use the signed-in Supabase administrator session.

Without `OPENAI_API_KEY`, reports may still be imported, but they stop for review because the required Filipino-first analysis cannot be completed automatically.

## Cron schedule

The production Vercel configuration calls `/api/news/ingest` once daily at `00:15 UTC`, which is `08:15 Asia/Manila`. This schedule works on Vercel Hobby limits. On a paid Vercel plan, it can be changed after source quality and operating cost are reviewed.

## Database objects

The production Supabase project contains:

- `news_sources`
- `news_articles`
- `news_ingestion_runs`

RLS rules expose only `published` news articles publicly. Source configuration, stopped stories, rejected items, corrections, and ingestion history remain available only to authorized FMB staff. Writes from the browser require the existing FMB administrator role.

## First launch checklist

1. Add one to three official, reliable feeds.
2. Leave **Publish automatically when safeguards pass** enabled.
3. Select **Run import now**.
4. Check the first Filipino-impact packages against the original sources.
5. Confirm that sensitive stories appear in the exception queue rather than publishing.
6. Pause any source whose feed quality, ownership, accuracy, or rights terms become unreliable.
