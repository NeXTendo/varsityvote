
-- ============================================================
-- 010_scoreboard_config.sql
-- Configure visibility of real-time tallies across user groups.
-- ============================================================

alter table public.elections 
add column if not exists scoreboard_config jsonb not null default '{
  "enabled_for_voters": false,
  "enabled_for_candidates": false,
  "enabled_for_admins": true,
  "show_live_tallies": false
}';

comment on column public.elections.scoreboard_config is 'JSON configuration for the floating real-time scoreboard widget.';
