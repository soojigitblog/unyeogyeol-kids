-- P3.4 "아이에게 통하는 말" + "부모×아이 충돌지도" — 별도 테이블.
--
-- 중요: reports.report_payload_json 은 절대 건드리지 않는다. 이 프로젝트는 결제
-- 확인(confirmPayment) 이후 report_payload_json/report_version 이 어떤 경로로도
-- 바뀌지 않는다는 것을 DB 트리거(prevent_paid_report_payload_change)와 정적 감사
-- 테스트(p24Snapshot.test.ts §5)로 이중 보장한다. 새 콘텐츠는 이 별도 테이블에 쓰고,
-- 읽을 때 report_payload_json 위에 얹어서(merge) 응답한다 — snapshot 자체는 불변으로 둔다.

create table if not exists paid_extras (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references reports(id) on delete cascade,
  talking_points_json jsonb not null,
  conflict_map_json jsonb not null,
  generation_source text not null check (generation_source in ('ai', 'fallback')),
  created_at timestamptz not null default now()
);

create index if not exists idx_paid_extras_report on paid_extras(report_id);

alter table paid_extras enable row level security;

create policy "deny_all_paid_extras" on paid_extras for all using (false);
