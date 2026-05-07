-- ============================================================
-- cast_vote.sql
-- Atomically validates token, casts anonymous ballot,
-- invalidates token, and updates candidate tally.
-- ============================================================

create or replace function public.cast_vote(
  p_election_id   uuid,
  p_candidate_id  uuid,
  p_token         text,
  p_position      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_voter_id    uuid := auth.uid();
  v_profile     profiles%rowtype;
  v_election    elections%rowtype;
  v_candidate   candidates%rowtype;
  v_token_row   vote_tokens%rowtype;
  v_vote_hash   text;
  v_vote_id     uuid;
begin
  -- 1. Auth check
  if v_voter_id is null then
    raise exception 'Unauthenticated';
  end if;

  -- 2. Profile
  select * into v_profile from profiles where id = v_voter_id;
  if not v_profile.is_active then
    raise exception 'Account is inactive';
  end if;

  -- 3. Election
  select * into v_election from elections where id = p_election_id;
  if not found then
    raise exception 'Election not found';
  end if;

  if v_election.institution_id != v_profile.institution_id then
    raise exception 'Institution mismatch';
  end if;

  if v_election.status != 'active'
     or now() < v_election.voting_start
     or now() > v_election.voting_end then
    raise exception 'Voting window is closed';
  end if;

  -- 4. Validate token belongs to this voter
  select * into v_token_row
    from vote_tokens
   where token = p_token
     and election_id = p_election_id
     and voter_id = v_voter_id;

  if not found then
    raise exception 'Invalid token';
  end if;

  if v_token_row.used then
    raise exception 'Token already used — duplicate vote rejected';
  end if;

  -- 5. Validate candidate is approved and in this election/position
  select * into v_candidate
    from candidates
   where id = p_candidate_id
     and election_id = p_election_id
     and position = p_position
     and status = 'approved';

  if not found then
    raise exception 'Invalid candidate';
  end if;

  -- 6. Compute vote hash (tamper-detection)
  v_vote_hash := encode(
    digest(p_token || p_candidate_id::text || p_election_id::text, 'sha256'),
    'hex'
  );

  -- 7. Atomically: invalidate token + insert vote + increment tally
  update vote_tokens
     set used = true, used_at = now()
   where id = v_token_row.id;

  insert into votes (election_id, candidate_id, token_id, vote_hash, position)
  values (p_election_id, p_candidate_id, v_token_row.id, v_vote_hash, p_position)
  returning id into v_vote_id;

  update candidates
     set vote_count = vote_count + 1
   where id = p_candidate_id;

  -- 8. Audit (no voter linkage in metadata)
  perform log_audit_event(
    v_profile.institution_id,
    null,   -- actor_id null: preserve anonymity
    'vote_cast',
    'election', p_election_id,
    jsonb_build_object(
      'election_id',  p_election_id,
      'position',     p_position,
      'vote_hash',    v_vote_hash
    )
  );

  return jsonb_build_object(
    'success',    true,
    'vote_id',    v_vote_id,
    'vote_hash',  v_vote_hash
  );
end;
$$;