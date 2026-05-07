
-- ============================================================
-- 009_voting_functions.sql
-- Core voting logic: token issuance, ballot casting, and results.
-- ============================================================

-- Ensure pgcrypto for hashing
create extension if not exists pgcrypto;

-- 1. Fix votes table constraint to allow one vote PER POSITION per token
alter table public.votes drop constraint if exists votes_token_id_key;
alter table public.votes drop constraint if exists votes_token_id_position_key;
alter table public.votes add constraint votes_token_id_position_key unique (token_id, "position");

-- 2. Function to issue or retrieve a voting token
create or replace function public.issue_vote_token(p_election_id uuid)
returns setof public.vote_tokens
language plpgsql security definer as $$
declare
  v_voter_id uuid;
begin
  v_voter_id := auth.uid();
  if v_voter_id is null then
    raise exception 'Authentication required.';
  end if;

  -- Ensure election is active for token issuance
  if not exists (select 1 from public.elections where id = p_election_id and status = 'active') then
    raise exception 'Election is not currently active.';
  end if;

  insert into public.vote_tokens (election_id, voter_id)
  values (p_election_id, v_voter_id)
  on conflict (election_id, voter_id) do nothing;

  return query 
  select * from public.vote_tokens 
   where election_id = p_election_id 
     and voter_id = v_voter_id;
end;
$$;

-- 3. Function to cast an anonymous vote
create or replace function public.cast_vote(
  p_election_id  uuid,
  p_candidate_id uuid,
  p_token        text,
  p_position     text
)
returns jsonb
language plpgsql security definer as $$
declare
  v_token_id uuid;
  v_vote_id  uuid;
  v_vote_hash text;
begin
  -- 1. Find the token
  select id into v_token_id
    from public.vote_tokens
   where election_id = p_election_id
     and token = p_token;

  if v_token_id is null then
    raise exception 'Voting token not found.';
  end if;

  -- 2. Check if already voted for THIS position
  if exists (select 1 from public.votes where token_id = v_token_id and "position" = p_position) then
    raise exception 'Vote already cast for this position.';
  end if;

  -- 3. Validate election status
  if not exists (select 1 from public.elections where id = p_election_id and status = 'active') then
    raise exception 'Election is not active.';
  end if;

  -- 4. Record vote
  v_vote_hash := encode(digest(p_token || p_candidate_id::text || p_election_id::text, 'sha256'), 'hex');
  
  insert into public.votes (election_id, candidate_id, token_id, vote_hash, "position")
  values (p_election_id, p_candidate_id, v_token_id, v_vote_hash, p_position)
  returning id into v_vote_id;

  -- 5. Mark used
  update public.vote_tokens set used = true, used_at = now() where id = v_token_id;

  return jsonb_build_object(
    'vote_id', v_vote_id,
    'vote_hash', v_vote_hash
  );
end;
$$;

-- 4. Function to get aggregated results
create or replace function public.get_results(p_election_id uuid)
returns table (
  candidate_id uuid,
  full_name text,
  "position" text,
  vote_count bigint
)
language plpgsql security definer as $$
begin
  -- Privacy check
  if not (
    public.current_role() in ('super_admin', 'election_admin') or
    exists (select 1 from public.elections where id = p_election_id and results_visible = true)
  ) then
    raise exception 'Results are not yet public.';
  end if;

  return query
  select 
    c.id as candidate_id,
    p.full_name,
    c."position",
    count(v.id) as vote_count
  from public.candidates c
  join public.profiles p on p.id = c.profile_id
  left join public.votes v on v.candidate_id = c.id
  where c.election_id = p_election_id
    and c.status = 'approved'
  group by c.id, p.full_name, c."position"
  order by c."position", vote_count desc;
end;
$$;
