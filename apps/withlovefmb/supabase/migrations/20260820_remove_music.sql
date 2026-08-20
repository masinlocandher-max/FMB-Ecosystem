-- Retire the FMB Music product backend.
-- The product-specific table is no longer defined by schema.sql.
drop table if exists public.music_entries cascade;
