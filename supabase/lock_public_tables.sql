-- GoodLegal launch security patch
-- Run this in Supabase SQL Editor for project eqeoodueblorspdjenky.
-- It turns on Row Level Security for public tables created by the app.
--
-- With RLS enabled and no anon/authenticated policies, Supabase's public API
-- cannot read, edit, or delete rows from these tables. The Render server still
-- uses the private DATABASE_URL connection to operate the app.

alter table if exists public.lawyers enable row level security;
alter table if exists public.intakes enable row level security;

revoke all on table public.lawyers from anon, authenticated;
revoke all on table public.intakes from anon, authenticated;

-- Optional verification query:
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public' and tablename in ('lawyers', 'intakes');
