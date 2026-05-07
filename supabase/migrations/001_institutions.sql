-- ============================================================
-- 001_institutions.sql
-- Top-level tenant table. Every other table FK's into this.
-- ============================================================

create extension if not exists "pgcrypto";

create table public.institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,          -- e.g. "unza", "nipa", "cbu"
  logo_url    text,
  domain      text,                          -- optional email domain filter
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger institutions_updated_at
  before update on public.institutions
  for each row execute function public.set_updated_at();

-- Seed: initial institutions
insert into public.institutions (name, slug, domain) values
  ('University of Zambia',              'unza',       'unza.zm'),
  ('National Institute of Public Admin','nipa',       'nipa.ac.zm'),
  ('Zambia Centre for Accountancy',     'zcas',       'zcas.ac.zm'),
  ('Copperbelt University',             'cbu',        'cbu.ac.zm'),
  ('Mulungushi University',             'mulungushi', 'mu.ac.zm');