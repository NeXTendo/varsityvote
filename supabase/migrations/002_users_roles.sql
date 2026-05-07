-- ============================================================
-- 002_users_roles.sql
-- Extends Supabase auth.users with profiles + role assignment.
-- ============================================================

create type public.user_role as enum (
  'super_admin',
  'election_admin',
  'candidate',
  'voter'
);

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  institution_id  uuid references public.institutions(id) on delete set null,
  full_name       text not null,
  student_id      text,                       -- institutional student number
  email           text not null,
  role            public.user_role not null default 'voter',
  avatar_url      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One student_id per institution
  unique (institution_id, student_id)
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on auth.users insert via trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inst_id uuid;
begin
  -- Try to resolve institution from email domain
  select id into inst_id
    from public.institutions
   where domain = split_part(new.email, '@', 2)
     and is_active = true
   limit 1;

  insert into public.profiles (id, email, full_name, institution_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    inst_id,
    'voter'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes
create index profiles_institution_id_idx on public.profiles(institution_id);
create index profiles_role_idx            on public.profiles(role);
create index profiles_email_idx           on public.profiles(email);