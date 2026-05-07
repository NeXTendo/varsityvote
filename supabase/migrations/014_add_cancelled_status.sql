-- ============================================================
-- 014_add_cancelled_status.sql
-- Adds 'cancelled' to the election_status enum and prevents
-- the auto-sync trigger from overwriting a cancelled election.
-- ============================================================

-- 1. Extend the enum
alter type public.election_status add value if not exists 'cancelled';

-- 2. Update sync trigger so it doesn't stomp on cancelled elections
create or replace function public.sync_election_status()
returns trigger language plpgsql as $$
begin
  -- Never auto-transition away from cancelled
  if new.status = 'cancelled' then
    return new;
  end if;

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
