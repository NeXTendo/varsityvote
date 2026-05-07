-- ============================================================
-- 004_candidates.sql
-- ============================================================

create type public.candidate_status as enum (
  'pending',
  'approved',
  'rejected',
  'withdrawn'
);

create table public.candidates (
  id              uuid primary key default gen_random_uuid(),
  election_id     uuid not null references public.elections(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  position        text not null,                    -- e.g. "President", "Treasurer"
  status          public.candidate_status not null default 'pending',
  bio             text,
  manifesto       text,
  manifesto_url   text,                             -- Supabase Storage link
  photo_url       text,
  video_url       text,
  vote_count      int not null default 0,           -- denormalised; updated by RPC
  approved_by     uuid references public.profiles(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One candidacy per profile per election per position
  unique (election_id, profile_id, position)
);

create trigger candidates_updated_at
  before update on public.candidates
  for each row execute function public.set_updated_at();

create index candidates_election_id_idx on public.candidates(election_id);
create index candidates_profile_id_idx  on public.candidates(profile_id);
create index candidates_status_idx      on public.candidates(status);