-- Run this cleanup only before re-running supabase/schema.sql on a project
-- where the production policies already exist. It makes policy recreation safe
-- without weakening any permission.

drop policy if exists "profiles self or admin read" on public.profiles;
drop policy if exists "profiles owner safe update" on public.profiles;
drop policy if exists "legal owner or admin read" on public.legal_acceptances;

drop policy if exists "journal active owner read" on public.journal_entries;
drop policy if exists "journal active owner insert" on public.journal_entries;
drop policy if exists "journal active owner update" on public.journal_entries;
drop policy if exists "journal active owner delete" on public.journal_entries;

drop policy if exists "saved active owner select" on public.saved_content;
drop policy if exists "saved active owner insert" on public.saved_content;
drop policy if exists "saved active owner update" on public.saved_content;
drop policy if exists "saved active owner delete" on public.saved_content;

drop policy if exists "wall public owner staff read" on public.freedom_wall_posts;
drop policy if exists "wall active member insert" on public.freedom_wall_posts;
drop policy if exists "wall owner revise" on public.freedom_wall_posts;
drop policy if exists "wall owner delete unpublished" on public.freedom_wall_posts;
drop policy if exists "wall staff moderate" on public.freedom_wall_posts;

drop policy if exists "content public or admin read" on public.content_items;
drop policy if exists "content admin insert" on public.content_items;
drop policy if exists "content admin update" on public.content_items;
drop policy if exists "content admin delete" on public.content_items;

drop policy if exists "music public or admin read" on public.music_entries;
drop policy if exists "music admin insert" on public.music_entries;
drop policy if exists "music admin update" on public.music_entries;
drop policy if exists "music admin delete" on public.music_entries;

drop policy if exists "media admin select" on public.media_assets;
drop policy if exists "media admin insert" on public.media_assets;
drop policy if exists "media admin update" on public.media_assets;
drop policy if exists "media admin delete" on public.media_assets;

drop policy if exists "contact admin read" on public.contact_messages;
drop policy if exists "contact admin update" on public.contact_messages;
drop policy if exists "activity admin read" on public.admin_activity;
drop policy if exists "activity admin insert" on public.admin_activity;

drop policy if exists "avatar owner upload" on storage.objects;
drop policy if exists "avatar owner update" on storage.objects;
drop policy if exists "avatar owner delete" on storage.objects;
drop policy if exists "site media admin insert" on storage.objects;
drop policy if exists "site media admin update" on storage.objects;
drop policy if exists "site media admin delete" on storage.objects;
