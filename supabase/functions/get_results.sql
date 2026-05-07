-- ============================================================
-- get_results.sql
-- Returns aggregate results only — no voter data exposed.
-- ============================================================

create or replace function public.get_results(p_election_id uuid)
returns table (
  candidate_id    uuid,
  candidate_name  text,
  position        text,
  photo_url       text,
  vote_count      bigint,
  percentage      numeric,
  is_winner       boolean
) language plpgsql security definer set search_path = public as $$
declare
  v_election    elections%rowtype;
  v_profile     profiles%rowtype;
begin
  select * into v_profile from profiles where id = auth.uid();
  select * into v_election from elections where id = p_election_id;

  if not found then
    raise exception 'Election not found';
  end if;

  -- Institution check
  if v_election.institution_id != v_profile.institution_id then
    raise exception 'Access denied';
  end if;

  -- Voters can only see results when published
  if v_profile.role = 'voter' and not v_election.results_visible then
    raise exception 'Results not yet published';
  end if;

  -- Return aggregated results per position
  return query
    with totals as (
      select c.position, sum(c.vote_count) as total_votes
        from candidates c
       where c.election_id = p_election_id
         and c.status = 'approved'
       group by c.position
    ),
    ranked as (
      select
        c.id                                            as candidate_id,
        p.full_name                                     as candidate_name,
        c.position,
        c.photo_url,
        c.vote_count::bigint,
        case when t.total_votes > 0
          then round(c.vote_count::numeric / t.total_votes * 100, 1)
          else 0
        end                                             as percentage,
        rank() over (
          partition by c.position
          order by c.vote_count desc
        ) = 1                                           as is_winner
      from candidates c
      join profiles p on p.id = c.profile_id
      join totals t   on t.position = c.position
     where c.election_id = p_election_id
       and c.status = 'approved'
    )
    select * from ranked
    order by position, vote_count desc;
end;
$$;