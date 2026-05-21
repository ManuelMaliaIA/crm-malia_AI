-- ============================================================
-- Apex CRM — Schema SQL para Supabase
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================================

-- Tipos ENUM
create type contact_status as enum ('lead', 'prospect', 'customer', 'churned');
create type deal_stage as enum ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
create type activity_type as enum ('note', 'email', 'call', 'meeting', 'task');

-- Tabla: companies
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  domain      text,
  industry    text,
  size        text,
  website     text,
  user_id     uuid not null references auth.users(id) on delete cascade
);

-- Tabla: contacts
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  phone       text,
  company_id  uuid references public.companies(id) on delete set null,
  status      contact_status not null default 'lead',
  owner       text,
  avatar_url  text,
  title       text,
  user_id     uuid not null references auth.users(id) on delete cascade
);

-- Tabla: deals
create table if not exists public.deals (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  value       numeric(15,2) not null default 0,
  stage       deal_stage not null default 'prospecting',
  probability integer not null default 20 check (probability between 0 and 100),
  contact_id  uuid references public.contacts(id) on delete set null,
  company_id  uuid references public.companies(id) on delete set null,
  owner       text,
  close_date  date,
  description text,
  user_id     uuid not null references auth.users(id) on delete cascade
);

-- Tabla: activities
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        activity_type not null default 'note',
  title       text not null,
  body        text,
  contact_id  uuid references public.contacts(id) on delete cascade,
  deal_id     uuid references public.deals(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  due_at      timestamptz,
  completed   boolean not null default false
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.companies  enable row level security;
alter table public.contacts   enable row level security;
alter table public.deals      enable row level security;
alter table public.activities enable row level security;

-- Companies RLS
create policy "Users see own companies"  on public.companies for select using (auth.uid() = user_id);
create policy "Users insert own companies" on public.companies for insert with check (auth.uid() = user_id);
create policy "Users update own companies" on public.companies for update using (auth.uid() = user_id);
create policy "Users delete own companies" on public.companies for delete using (auth.uid() = user_id);

-- Contacts RLS
create policy "Users see own contacts"  on public.contacts for select using (auth.uid() = user_id);
create policy "Users insert own contacts" on public.contacts for insert with check (auth.uid() = user_id);
create policy "Users update own contacts" on public.contacts for update using (auth.uid() = user_id);
create policy "Users delete own contacts" on public.contacts for delete using (auth.uid() = user_id);

-- Deals RLS
create policy "Users see own deals"  on public.deals for select using (auth.uid() = user_id);
create policy "Users insert own deals" on public.deals for insert with check (auth.uid() = user_id);
create policy "Users update own deals" on public.deals for update using (auth.uid() = user_id);
create policy "Users delete own deals" on public.deals for delete using (auth.uid() = user_id);

-- Activities RLS
create policy "Users see own activities"  on public.activities for select using (auth.uid() = user_id);
create policy "Users insert own activities" on public.activities for insert with check (auth.uid() = user_id);
create policy "Users update own activities" on public.activities for update using (auth.uid() = user_id);
create policy "Users delete own activities" on public.activities for delete using (auth.uid() = user_id);

-- ============================================================
-- Índices para performance
-- ============================================================
create index on public.contacts (user_id, status);
create index on public.deals (user_id, stage);
create index on public.activities (contact_id, created_at desc);
create index on public.activities (deal_id, created_at desc);

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table public.contacts;
alter publication supabase_realtime add table public.deals;
alter publication supabase_realtime add table public.activities;

-- ============================================================
-- Datos de ejemplo (opcional — solo para desarrollo)
-- ============================================================
-- Los inserts de ejemplo requieren un user_id válido.
-- Ejecuta después de registrar tu primer usuario.
