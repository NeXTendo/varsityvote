-- ============================================================
-- 003_elections.sql
-- ============================================================

create type public.election_status as enum (
  'draft',
  'active',
  'closed',
  'results_published'
);

create table public.elections (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  created_by      uuid not null references public.profiles(id),
  title           text not null,
  description     text,
  status          public.election_status not null default 'draft',
  voting_start    timestamptz,
  voting_end      timestamptz,
  results_visible boolean not null default false,   -- admin toggle: show results to voters
  max_votes       int not null default 1,           -- votes per ballot (usually 1 per position)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint voting_window_valid check (
    voting_end is null or voting_start is null or voting_end > voting_start
  )
);

create trigger elections_updated_at
  before update on public.elections
  for each row execute function public.set_updated_at();

-- Auto-transition status based on window
create or replace function public.sync_election_status()
returns trigger language plpgsql as $$
begin
  if new.voting_start is not null and new.voting_end is not null then
    if now() < new.voting_start then
      new.status = 'draft';
    elsif now() between new.voting_start and new.voting_end then
      new.status = 'active';
    else
      new.status = 'closed';
    end if;
  end if;
  return new;
end;
$$;

create trigger elections_sync_status
  before insert or update on public.elections
  for each row execute function public.sync_election_status();

-- Indexes
create index elections_institution_id_idx on public.elections(institution_id);
create index elections_status_idx          on public.elections(status);
create index elections_window_idx          on public.elections(voting_start, voting_end);