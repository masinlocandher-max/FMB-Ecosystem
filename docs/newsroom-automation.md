# FMB Newsroom Automation

This system adds automated collection and safeguard-based publishing to FMB News while preserving a clear Filipino-first public-interest standard.

## Base factual story structure

Every public factual story must contain:

1. **What happened**: a neutral, source-bound summary.
2. **What this means for Filipinos**: a direct explanation of the practical public impact.
3. **Who may feel it most**: affected Filipino groups supported by the source.
4. **Effect on everyday life**: possible effects on expenses, income, work, services, safety, rights, time, or opportunity.
5. **What Filipinos should watch next**: useful questions, verification points, preparations, or public-interest actions.

The database prevents publication when these required public-interest sections are missing, too weak, or supported only with low confidence.

## Fact reporting versus FMB opinion

Ordinary news, advisories, and explainers do **not** carry an FMB personal opinion.

An **FMB Perspective** may appear only when:

- the story is explicitly classified as `analysis` or `opinion`;
- the perspective is written or deliberately approved by FMB;
- it is clearly labeled and visually separated from the factual report;
- it centers ordinary Filipinos across income levels, especially poor and vulnerable communities when relevant;
- it evaluates outcomes rather than promoting or attacking a politician or public figure.

The database automatically removes an FMB Perspective from factual `news`, `advisory`, and `explainer` records.

## Publishing flow

1. An administrator approves an official RSS, Atom, or JSON Feed in the private FMB&CO. Orchestrator.
2. `/api/news/ingest` checks active feeds and imports the title, source URL, feed excerpt, publication date, byline, and feed-provided image URL.
3. The system creates the Filipino public-interest structure using only the supplied source material.
4. New approved sources default to automatic publishing.
5. A factual story publishes automatically when:
   - the source allows automatic publishing;
   - the story is not classified as high risk;
   - all Filipino public-interest sections are complete;
   - the impact analysis has medium or high confidence.
6. Official speeches, budgets, laws, appointments, election results, agency announcements, and other factual public-affairs reports may publish automatically when the safeguards pass.
7. Allegations, crime, fraud, legal disputes, sensitive health claims, deaths, violence, private-person stories, weak evidence, and low-confidence impact analysis stop in the exception queue.
8. High-risk stories cannot publish without a named administrator review.
9. Analysis and opinion cannot publish without an explicitly approved FMB Perspective.
10. Published rows appear on `/news/` and open as source-attributed briefs at `/news/story.html?slug=...`.
11. FMB News links readers to the original report and does not reproduce the source article in full.

## Filipino public-interest rules

The automated factual analysis must:

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
- `OPENAI_API_KEY` (required for automatic Filipino public-interest drafting and automatic publication)

Optional:

- `NEWS_SUMMARY_MODEL` defaults to `gpt-5-mini`.
- `NEWS_ADMIN_TOKEN` is an emergency manual-trigger fallback. Normal manual imports use the signed-in Supabase administrator session.

Without `OPENAI_API_KEY`, reports may still be imported, but they stop for review because the required Filipino public-interest analysis cannot be completed automatically.

## Cron schedule

The production Vercel configuration calls `/api/news/ingest` at minute `00` of every hour using `0 * * * *`.

Cron jobs activate only after a production deployment. The Vercel account must support the configured hourly frequency. If the production plan rejects hourly scheduling, the deployment must use a supported external or database scheduler rather than silently falling back to daily checks.

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
5. Confirm that ordinary factual reports contain no FMB Perspective.
6. Confirm that sensitive stories appear in the exception queue rather than publishing.
7. Pause any source whose feed quality, ownership, accuracy, or rights terms become unreliable.
