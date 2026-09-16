-- P3.3 Refund requests: customer submits a reason + optional screenshot,
-- admin reviews and decides manually. Additive only — does not touch any
-- existing table. The actual money refund (Toss cancel / bank transfer) is
-- still performed by the admin outside this app; this table only tracks the
-- request and the admin's decision.

create table if not exists refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  owner_session_id uuid not null references guest_sessions(id) on delete cascade,
  reason text not null,
  screenshot_data_url text,
  status text not null default 'PENDING' check (
    status in ('PENDING', 'APPROVED', 'REJECTED')
  ),
  admin_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_refund_requests_order on refund_requests(order_id);
create index if not exists idx_refund_requests_status on refund_requests(status);

alter table refund_requests enable row level security;

create policy "deny_all_refund_requests" on refund_requests for all using (false);

-- Apply against the live project with:
--   supabase login && supabase link --project-ref <ref> && supabase db push
-- or paste this file's contents into the Supabase SQL editor.
