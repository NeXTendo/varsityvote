-- ============================================================
-- 006_audit_logs.sql
-- Immutable append-only event log for all system actions.
-- ============================================================

create type public.audit_action as enum (
  'election_created',
  'election_updated',
  'election_status_changed',
  'candidate_registered',
  'candidate_approved',
  'candidate_rejected',
  'vote_token_issued',
  'vote_cast',
  'results_published',
  'user_role_changed',
  'login_success',
  'login_failed'
);

create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid references public.institutions(id) on delete set null,
  actor_id        uuid references public.profiles(id) on delete set null,
  action          public.audit_action not null,
  target_type     text,                    -- e.g. 'election', 'candidate', 'vote'
  target_id       uuid,
  metadata        jsonb default '{}',      -- action-specific context (no PII)
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- Immutable: no updates, no deletes
create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Audit logs are immutable.';
end;
$$;

create trigger audit_logs_immutable_update
  before update on public.audit_logs
  for each row execute function public.prevent_audit_mutation();

create trigger audit_logs_immutable_delete
  before delete on public.audit_logs
  for each row execute function public.prevent_audit_mutation();

-- Indexes
create index audit_logs_institution_id_idx on public.audit_logs(institution_id);
create index audit_logs_actor_id_idx        on public.audit_logs(actor_id);
create index audit_logs_action_idx          on public.audit_logs(action);
create index audit_logs_target_idx          on public.audit_logs(target_type, target_id);
create index audit_logs_created_at_idx      on public.audit_logs(created_at desc);

-- Helper function for application code to write audit events
create or replace function public.log_audit_event(
  p_institution_id  uuid,
  p_actor_id        uuid,
  p_action          public.audit_action,
  p_target_type     text default null,
  p_target_id       uuid default null,
  p_metadata        jsonb default '{}'
) returns void language plpgsql security definer as $$
begin
  insert into public.audit_logs
    (institution_id, actor_id, action, target_type, target_id, metadata)
  values
    (p_institution_id, p_actor_id, p_action, p_target_type, p_target_id, p_metadata);
end;
$$;