-- ============================================================
-- seed.sql — Development seed data
-- Run AFTER all migrations. Uses service role.
-- ============================================================

-- NOTE: Auth users must be created via Supabase Auth API or dashboard.
-- The UUIDs below are placeholders — replace with real auth.users IDs.

-- Promote a user to super_admin (replace with real user ID)
-- update public.profiles
--   set role = 'super_admin'
-- where email = 'admin@securevote.zm';

-- Promote a user to election_admin at UNZA
-- update public.profiles
--   set role = 'election_admin',
--       institution_id = (select id from public.institutions where slug = 'unza')
-- where email = 'electionadmin@unza.zm';

-- Sample election (run after creating an election_admin)
-- insert into public.elections (institution_id, created_by, title, description, voting_start, voting_end)
-- select
--   (select id from public.institutions where slug = 'unza'),
--   (select id from public.profiles where email = 'electionadmin@unza.zm'),
--   'UNZA Student Union Elections 2025',
--   'Annual elections for the University of Zambia Student Union executive positions.',
--   now() + interval '1 hour',
--   now() + interval '3 days';