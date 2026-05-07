-- ============================================================
-- 013_auto_student_id.sql
-- Auto-generate student IDs in format: SLUG+YEAR+6DIGIT_SEQ
-- e.g. NIPA2026000000, UNZA2026000001, CBU2026000003
-- ============================================================

-- ── 1. Sequence table (one row per institution, atomically incremented) ──────
create table if not exists public.institution_student_sequences (
  institution_id uuid primary key references public.institutions(id) on delete cascade,
  last_seq       integer not null default 0
);

-- RLS: only service role can touch this table
alter table public.institution_student_sequences enable row level security;

-- ── 2. Initialize sequences from existing data ────────────────────────────────
-- Seed the sequence for every institution that already has students,
-- so new IDs don't collide with manually-set ones.
insert into public.institution_student_sequences (institution_id, last_seq)
select
  p.institution_id,
  count(*) as last_seq
from public.profiles p
where p.institution_id is not null
  and p.student_id is not null
group by p.institution_id
on conflict (institution_id) do update
  set last_seq = excluded.last_seq;

-- ── 3. Core generator function ────────────────────────────────────────────────
create or replace function public.generate_student_id(p_institution_id uuid)
returns text
language plpgsql
as $$
declare
  v_initials text;
  v_year     text;
  v_seq      integer;
  v_result   text;
begin
  -- Get the institution slug (uppercased) as the school initials
  select upper(slug)
    into v_initials
    from public.institutions
   where id = p_institution_id;

  if v_initials is null then
    return null;
  end if;

  v_year := to_char(now(), 'YYYY');

  -- Atomically increment the sequence for this institution
  -- INSERT ... ON CONFLICT DO UPDATE is a single atomic operation
  insert into public.institution_student_sequences (institution_id, last_seq)
  values (p_institution_id, 1)
  on conflict (institution_id) do update
    set last_seq = institution_student_sequences.last_seq + 1
  returning last_seq into v_seq;

  -- Build: SLUG + YEAR + zero-padded 6-digit sequence (0-based)
  v_result := v_initials || v_year || lpad((v_seq - 1)::text, 6, '0');

  return v_result;
end;
$$;

-- ── 4. Trigger function ───────────────────────────────────────────────────────
create or replace function public.trg_auto_assign_student_id()
returns trigger
language plpgsql
as $$
begin
  -- Only auto-assign if:
  --   a) student_id is NULL (don't overwrite manually set IDs)
  --   b) institution_id is provided (need school to derive initials)
  if new.student_id is null and new.institution_id is not null then
    new.student_id := public.generate_student_id(new.institution_id);
  end if;

  return new;
end;
$$;

-- ── 5. Attach trigger to profiles (BEFORE INSERT) ─────────────────────────────
drop trigger if exists trg_auto_assign_student_id on public.profiles;

create trigger trg_auto_assign_student_id
  before insert on public.profiles
  for each row
  execute function public.trg_auto_assign_student_id();

-- ── 6. Unique constraint on student_id to prevent any race-condition dupes ───
-- (safe to add; if it already exists, the DO NOTHING handles it)
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'profiles_student_id_key'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_student_id_key unique (student_id);
  end if;
end
$$;

-- ── 7. Back-fill: assign IDs to existing students that have none ──────────────
-- Run in a loop to respect the atomic sequence for each institution
do $$
declare
  r record;
begin
  for r in
    select id, institution_id
      from public.profiles
     where student_id is null
       and institution_id is not null
     order by created_at asc  -- oldest first to preserve creation order
  loop
    update public.profiles
       set student_id = public.generate_student_id(r.institution_id)
     where id = r.id;
  end loop;
end
$$;
