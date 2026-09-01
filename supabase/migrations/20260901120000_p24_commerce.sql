-- P2.4 Commerce: Guest sessions, profiles, reports, orders, ownership

create extension if not exists "pgcrypto";

-- Guest session (no signup)
create table if not exists guest_sessions (
  id uuid primary key default gen_random_uuid(),
  access_token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists child_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  name text,
  gender text not null,
  birth_date date not null,
  birth_time time,
  birth_time_unknown boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_child_profiles_owner on child_profiles(owner_session_id);

create table if not exists caregiver_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  child_profile_id uuid not null references child_profiles(id) on delete cascade,
  role text not null,
  role_label text not null,
  display_name text,
  birth_date date not null,
  birth_time time,
  birth_time_unknown boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_caregiver_profiles_owner on caregiver_profiles(owner_session_id);

create table if not exists assessment_inputs (
  id uuid primary key default gen_random_uuid(),
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  child_profile_id uuid not null references child_profiles(id) on delete cascade,
  caregiver_profile_id uuid not null references caregiver_profiles(id) on delete cascade,
  free_answers_json jsonb not null default '{}'::jsonb,
  deep_answers_json jsonb not null default '{}'::jsonb,
  caregiver_answers_json jsonb not null default '{}'::jsonb,
  concern_id text not null,
  concern_micro_answers_json jsonb not null default '{}'::jsonb,
  current_conflict_json jsonb not null default '{}'::jsonb,
  version text not null default 'signature-v1',
  created_at timestamptz not null default now()
);

create index if not exists idx_assessment_inputs_owner on assessment_inputs(owner_session_id);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  child_profile_id uuid not null references child_profiles(id) on delete cascade,
  caregiver_profile_id uuid not null references caregiver_profiles(id) on delete cascade,
  assessment_input_id uuid not null references assessment_inputs(id) on delete cascade,
  product_id text not null,
  report_version text not null default 'signature-v1',
  report_payload_json jsonb not null,
  status text not null default 'LOCKED' check (status in ('DRAFT', 'LOCKED', 'UNLOCKED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_owner on reports(owner_session_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  product_id text not null,
  report_id uuid not null references reports(id) on delete cascade,
  amount integer not null,
  currency text not null default 'KRW',
  status text not null default 'CREATED' check (
    status in ('CREATED', 'PAYMENT_PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED')
  ),
  payment_provider text,
  payment_key text,
  requested_at timestamptz,
  approved_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_owner on orders(owner_session_id);
create index if not exists idx_orders_report on orders(report_id);

create table if not exists report_ownerships (
  id uuid primary key default gen_random_uuid(),
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  report_id uuid not null references reports(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, report_id)
);

create index if not exists idx_ownerships_owner on report_ownerships(owner_session_id);
create index if not exists idx_ownerships_report on report_ownerships(report_id);

-- RLS: block direct client access; server uses service role
alter table guest_sessions enable row level security;
alter table child_profiles enable row level security;
alter table caregiver_profiles enable row level security;
alter table assessment_inputs enable row level security;
alter table reports enable row level security;
alter table orders enable row level security;
alter table report_ownerships enable row level security;

create policy "deny_all_guest_sessions" on guest_sessions for all using (false);
create policy "deny_all_child_profiles" on child_profiles for all using (false);
create policy "deny_all_caregiver_profiles" on caregiver_profiles for all using (false);
create policy "deny_all_assessment_inputs" on assessment_inputs for all using (false);
create policy "deny_all_reports" on reports for all using (false);
create policy "deny_all_orders" on orders for all using (false);
create policy "deny_all_report_ownerships" on report_ownerships for all using (false);
