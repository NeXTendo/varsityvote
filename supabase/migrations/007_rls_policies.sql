-- ============================================================
-- 007_rls_policies.sql
-- Row-Level Security: institution isolation + role gating.
-- ============================================================

-- Helper: get current user's profile (cached per request)
create or replace function public.current_profile()
returns public.profiles language sql stable security definer as $$
  select * from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_institution_id()
returns uuid language sql stable security definer as $$
  select institution_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns public.user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- ── INSTITUTIONS ──────────────────────────────────────────────
alter table public.institutions enable row level security;

-- Everyone authenticated can read their own institution
drop policy if exists "institutions_select_own" on public.institutions;
create policy "institutions_select_own"
  on public.institutions for select
  using (id = public.current_institution_id());

-- Super admin can see and manage all
drop policy if exists "institutions_all_super_admin" on public.institutions;
create policy "institutions_all_super_admin"
  on public.institutions for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ── PROFILES ──────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can read own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

-- Users within same institution can read each other (for candidate listing)
drop policy if exists "profiles_select_same_institution" on public.profiles;
create policy "profiles_select_same_institution"
  on public.profiles for select
  using (institution_id = public.current_institution_id());

-- Users can update their own profile (limited fields via app logic)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Super admin / election admin can manage profiles in their institution
drop policy if exists "profiles_manage_admin" on public.profiles;
create policy "profiles_manage_admin"
  on public.profiles for all
  using (
    institution_id = public.current_institution_id()
    and public.current_role() = 'election_admin'
  )
  with check (
    institution_id = public.current_institution_id()
    and public.current_role() = 'election_admin'
  );

-- Super admin can manage ALL profiles
drop policy if exists "profiles_manage_super_admin" on public.profiles;
create policy "profiles_manage_super_admin"
  on public.profiles for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ── ELECTIONS ─────────────────────────────────────────────────
alter table public.elections enable row level security;

-- Voters see active elections in their institution
drop policy if exists "elections_select_voter" on public.elections;
create policy "elections_select_voter"
  on public.elections for select
  using (
    institution_id = public.current_institution_id()
    and status in ('active', 'closed', 'results_published')
  );

-- Admins see all elections in their institution
drop policy if exists "elections_select_admin" on public.elections;
create policy "elections_select_admin"
  on public.elections for select
  using (
    institution_id = public.current_institution_id()
    and public.current_role() = 'election_admin'
  );

-- Super admin sees all elections
drop policy if exists "elections_select_super_admin" on public.elections;
create policy "elections_select_super_admin"
  on public.elections for select
  using (public.current_role() = 'super_admin');

-- Election admin can create/update elections for their institution
drop policy if exists "elections_insert_admin" on public.elections;
create policy "elections_insert_admin"
  on public.elections for insert
  with check (
    institution_id = public.current_institution_id()
    and public.current_role() = 'election_admin'
  );

drop policy if exists "elections_update_admin" on public.elections;
create policy "elections_update_admin"
  on public.elections for update
  using (
    institution_id = public.current_institution_id()
    and public.current_role() = 'election_admin'
  );

-- Super admin can manage ALL elections
drop policy if exists "elections_manage_super_admin" on public.elections;
create policy "elections_manage_super_admin"
  on public.elections for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ── CANDIDATES ────────────────────────────────────────────────
alter table public.candidates enable row level security;

-- Anyone in the institution can view approved candidates
drop policy if exists "candidates_select_approved" on public.candidates;
create policy "candidates_select_approved"
  on public.candidates for select
  using (
    status = 'approved'
    and exists (
      select 1 from public.elections e
       where e.id = election_id
         and e.institution_id = public.current_institution_id()
    )
  );

-- Admins see all candidates in their institution's elections
drop policy if exists "candidates_select_admin" on public.candidates;
create policy "candidates_select_admin"
  on public.candidates for select
  using (
    public.current_role() = 'election_admin'
    and exists (
      select 1 from public.elections e
       where e.id = election_id
         and e.institution_id = public.current_institution_id()
    )
  );

-- Super admin sees all candidates
drop policy if exists "candidates_select_super_admin" on public.candidates;
create policy "candidates_select_super_admin"
  on public.candidates for select
  using (public.current_role() = 'super_admin');

-- Candidates can see their own entry
drop policy if exists "candidates_select_own" on public.candidates;
create policy "candidates_select_own"
  on public.candidates for select
  using (profile_id = auth.uid());

-- Voters can register as candidates (pending approval)
drop policy if exists "candidates_insert_self" on public.candidates;
create policy "candidates_insert_self"
  on public.candidates for insert
  with check (profile_id = auth.uid());

-- Candidates can update their own profile fields
drop policy if exists "candidates_update_own" on public.candidates;
create policy "candidates_update_own"
  on public.candidates for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status = 'pending');

-- Admins can approve/reject candidates
drop policy if exists "candidates_update_admin" on public.candidates;
create policy "candidates_update_admin"
  on public.candidates for update
  using (
    public.current_role() = 'election_admin'
    and exists (
      select 1 from public.elections e
       where e.id = election_id
         and e.institution_id = public.current_institution_id()
    )
  );

-- Super admin can manage ALL candidates
drop policy if exists "candidates_manage_super_admin" on public.candidates;
create policy "candidates_manage_super_admin"
  on public.candidates for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ── VOTE TOKENS ───────────────────────────────────────────────
alter table public.vote_tokens enable row level security;

-- Voters can see only their own token
drop policy if exists "vote_tokens_select_own" on public.vote_tokens;
create policy "vote_tokens_select_own"
  on public.vote_tokens for select
  using (voter_id = auth.uid());

-- Tokens are issued by RPC (security definer), not direct insert
-- Admins can view tokens for audit (no voter_id exposure needed)
drop policy if exists "vote_tokens_select_admin" on public.vote_tokens;
create policy "vote_tokens_select_admin"
  on public.vote_tokens for select
  using (
    public.current_role() = 'election_admin'
    and exists (
      select 1 from public.elections e
       where e.id = election_id
         and e.institution_id = public.current_institution_id()
    )
  );

-- Super admin sees all tokens
drop policy if exists "vote_tokens_select_super_admin" on public.vote_tokens;
create policy "vote_tokens_select_super_admin"
  on public.vote_tokens for select
  using (public.current_role() = 'super_admin');

-- ── VOTES ─────────────────────────────────────────────────────
alter table public.votes enable row level security;

-- Nobody can read individual votes directly (privacy)
-- Results are accessed via RPC get_results() which returns aggregates only
drop policy if exists "votes_no_direct_select" on public.votes;
create policy "votes_no_direct_select"
  on public.votes for select
  using (false);

-- Votes are inserted by RPC (security definer) only
drop policy if exists "votes_no_direct_insert" on public.votes;
create policy "votes_no_direct_insert"
  on public.votes for insert
  with check (false);

-- ── AUDIT LOGS ────────────────────────────────────────────────
alter table public.audit_logs enable row level security;

-- Admins can read their institution's audit log
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (
    institution_id = public.current_institution_id()
    and public.current_role() in ('super_admin', 'election_admin')
  );

-- Super admin sees all
drop policy if exists "audit_logs_select_super_admin" on public.audit_logs;
create policy "audit_logs_select_super_admin"
  on public.audit_logs for select
  using (public.current_role() = 'super_admin');

-- No direct inserts; only via log_audit_event() security definer function
drop policy if exists "audit_logs_no_direct_insert" on public.audit_logs;
create policy "audit_logs_no_direct_insert"
  on public.audit_logs for insert
  with check (false);