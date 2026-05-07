-- ============================================================
-- issue_vote_token.sql
-- Issues a unique voting token to an eligible voter.
-- Idempotent: returns existing token if already issued.
-- ============================================================

create or replace function public.issue_vote_token(p_election_id uuid)
returns table (token text, already_used boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_voter_id     uuid := auth.uid();
  v_election     elections%rowtype;
  v_profile      profiles%rowtype;
  v_token_row    vote_tokens%rowtype;
begin
  -- 1. Validate caller is authenticated
  if v_voter_id is null then
    raise exception 'Unauthenticated';
  end if;

  -- 2. Load voter profile
  select * into v_profile from profiles where id = v_voter_id;
  if not found then
    raise exception 'Profile not found';
  end if;

  if not v_profile.is_active then
    raise exception 'Account is inactive';
  end if;

  -- 3. Load and validate election
  select * into v_election from elections where id = p_election_id;
  if not found then
    raise exception 'Election not found';
  end if;

  -- 4. Institution match
  if v_election.institution_id != v_profile.institution_id then
    raise exception 'Election does not belong to your institution';
  end if;

  -- 5. Election must be active
  if v_election.status != 'active' then
    raise exception 'Election is not currently active';
  end if;

  -- Verify window is open
  if now() < v_election.voting_start or now() > v_election.voting_end then
    raise exception 'Voting window is not open';
  end if;

  -- 6. Idempotent: return existing token if already issued
  select * into v_token_row
    from vote_tokens
   where election_id = p_election_id
     and voter_id = v_voter_id;

  if found then
    -- Log re-issue attempt
    perform log_audit_event(
      v_profile.institution_id,
      v_voter_id,
      'vote_token_issued',
      'election', p_election_id,
      jsonb_build_object('reissue', true)
    );
    return query select v_token_row.token, v_token_row.used;
    return;
  end if;

  -- 7. Issue new token
  insert into vote_tokens (election_id, voter_id)
  values (p_election_id, v_voter_id)
  returning * into v_token_row;

  perform log_audit_event(
    v_profile.institution_id,
    v_voter_id,
    'vote_token_issued',
    'election', p_election_id,
    jsonb_build_object('reissue', false)
  );

  return query select v_token_row.token, false::boolean;
end;
$$;