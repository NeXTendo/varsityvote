-- ============================================================
-- 005_votes_tokens.sql
-- Core voting integrity: token-gated, anonymous ballots.
-- ============================================================

-- One token per voter per election. Invalidated on use.
create table public.vote_tokens (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections(id) on delete cascade,
  voter_id     uuid not null references public.profiles(id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(32), 'hex'),
  used         boolean not null default false,
  issued_at    timestamptz not null default now(),
  used_at      timestamptz,

  unique (election_id, voter_id)   -- one token per voter per election
);

create index vote_tokens_election_id_idx on public.vote_tokens(election_id);
create index vote_tokens_voter_id_idx    on public.vote_tokens(voter_id);
create index vote_tokens_token_idx       on public.vote_tokens(token);

-- Anonymous ballot: linked only to token (not voter)
create table public.votes (
  id              uuid primary key default gen_random_uuid(),
  election_id     uuid not null references public.elections(id) on delete cascade,
  candidate_id    uuid not null references public.candidates(id) on delete cascade,
  token_id        uuid not null unique references public.vote_tokens(id), -- 1-vote-per-token
  vote_hash       text not null,     -- sha256(token || candidate_id || election_id)
  position        text not null,     -- position being voted for
  cast_at         timestamptz not null default now()
  -- NOTE: no voter_id here — anonymity by design
);

create index votes_election_id_idx   on public.votes(election_id);
create index votes_candidate_id_idx  on public.votes(candidate_id);

-- Immutable: prevent updates or deletes on cast votes
create or replace function public.prevent_vote_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Votes are immutable and cannot be modified or deleted.';
end;
$$;

create trigger votes_immutable_update
  before update on public.votes
  for each row execute function public.prevent_vote_mutation();

create trigger votes_immutable_delete
  before delete on public.votes
  for each row execute function public.prevent_vote_mutation();