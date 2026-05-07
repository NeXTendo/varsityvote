-- ============================================================
-- 012_update_voting_functions.sql
-- ============================================================

-- Drop old functions first (required when changing signatures or return types)
drop function if exists public.cast_vote(uuid, uuid, text, text);
drop function if exists public.get_results(uuid);

-- 1. Update cast_vote to use position_id
create or replace function public.cast_vote(
  p_election_id    uuid,
  p_candidate_id   uuid,
  p_token          text,
  p_position_id    uuid
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
  if exists (select 1 from public.votes where token_id = v_token_id and election_position_id = p_position_id) then
    raise exception 'Vote already cast for this position.';
  end if;

  -- 3. Validate election status
  if not exists (select 1 from public.elections where id = p_election_id and status = 'active') then
    raise exception 'Election is not active.';
  end if;

  -- 4. Record vote
  v_vote_hash := encode(digest(p_token || p_candidate_id::text || p_election_id::text, 'sha256'), 'hex');
  
  insert into public.votes (election_id, candidate_id, token_id, vote_hash, election_position_id)
  values (p_election_id, p_candidate_id, v_token_id, v_vote_hash, p_position_id)
  returning id into v_vote_id;

  -- 5. Mark used
  update public.vote_tokens set used = true, used_at = now() where id = v_token_id;

  return jsonb_build_object(
    'vote_id', v_vote_id,
    'vote_hash', v_vote_hash
  );
end;
$$;

-- 2. Update get_results to join with election_positions
create or replace function public.get_results(p_election_id uuid)
returns table (
  candidate_id uuid,
  full_name text,
  position_title text,
  position_id uuid,
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
    ep.title as position_title,
    ep.id as position_id,
    count(v.id) as vote_count
  from public.candidates c
  join public.profiles p on p.id = c.profile_id
  join public.election_positions ep on ep.id = c.election_position_id
  left join public.votes v on v.candidate_id = c.id
  where c.election_id = p_election_id
    and c.status = 'approved'
  group by c.id, p.full_name, ep.title, ep.id
  order by ep.title, vote_count desc;
end;
$$;
