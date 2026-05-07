-- ============================================================
-- 011_dynamic_positions.sql
-- ============================================================

-- 1. Create categories for elections
create type public.election_category as enum (
  'university',
  'faculty',
  'department',
  'club',
  'hostel',
  'class'
);

-- 2. Enhance elections table
alter table public.elections
  add column category public.election_category not null default 'university',
  add column scope_id uuid, -- ID of faculty/dept if applicable
  add column registration_deadline timestamptz;

-- 3. Create election_positions table
create table public.election_positions (
  id              uuid primary key default gen_random_uuid(),
  election_id     uuid not null references public.elections(id) on delete cascade,
  title           text not null,
  description     text,
  max_candidates  int not null default 10,
  max_winners     int not null default 1,
  eligibility_rules jsonb default '{}'::jsonb,
  voting_method   text not null default 'fptp',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger election_positions_updated_at
  before update on public.election_positions
  for each row execute function public.set_updated_at();

create index election_positions_election_id_idx on public.election_positions(election_id);

-- 4. Transition candidates to positions
alter table public.candidates add column election_position_id uuid references public.election_positions(id);

-- MIGRATION: Create positions for existing candidates
do $$
declare
  v_election_id uuid;
  v_pos_title text;
  v_new_pos_id uuid;
begin
  for v_election_id, v_pos_title in 
    select distinct election_id, "position" from public.candidates
  loop
    insert into public.election_positions (election_id, title)
    values (v_election_id, v_pos_title)
    returning id into v_new_pos_id;

    update public.candidates
       set election_position_id = v_new_pos_id
     where election_id = v_election_id
       and "position" = v_pos_title;
  end loop;
end;
$$;

-- 5. Transition votes to positions
alter table public.votes add column election_position_id uuid references public.election_positions(id);

-- MIGRATION: Link votes to positions
update public.votes v
   set election_position_id = c.election_position_id
  from public.candidates c
 where v.candidate_id = c.id;

-- 6. Clean up constraints and old columns
-- Candidates
alter table public.candidates alter column election_position_id set not null;
alter table public.candidates drop constraint candidates_election_id_profile_id_position_key;
alter table public.candidates add constraint candidates_profile_position_unique unique (profile_id, election_position_id);
alter table public.candidates drop column "position";

-- Votes
alter table public.votes alter column election_position_id set not null;
alter table public.votes drop constraint votes_token_id_position_key;
alter table public.votes add constraint votes_token_id_position_unique unique (token_id, election_position_id);
alter table public.votes drop column "position";

-- 7. Update RLS (simple pass-through for now, as elections/candidates have policies)
alter table public.election_positions enable row level security;

create policy "Positions are visible to everyone"
  on public.election_positions for select
  using (true);

create policy "Admins can manage positions"
  on public.election_positions for all
  using (
    exists (
      select 1 from public.profiles
       where id = auth.uid()
         and role in ('super_admin', 'election_admin')
    )
  );
