-- P3.2 GUEST PAID RESULT RECOVERY
--
-- 이 마이그레이션은 기존 커머스 테이블(guest_sessions, child_profiles, caregiver_profiles,
-- assessment_inputs, reports, orders, report_ownerships)을 단 한 줄도 변경하지 않는다.
-- report_ownerships 는 "원 구매 소유권(canonical ownership)" 의미를 그대로 유지하며,
-- Recovery 권한은 아래 report_access_grants 라는 완전히 별도의 테이블로 분리한다.
--
-- Access Grant v2.1 설계:
--   Paid 접근 = report_ownerships(canonical) OR report_access_grants(recovery, active)
--   reportId 단독으로는 어떤 경우에도 접근 불가.

create table if not exists report_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  code_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_recovery_codes_report on report_recovery_codes(report_id);

-- report_id 당 활성(revoked_at is null) recovery code 는 최대 1개만 존재할 수 있다.
-- 동시 발급 요청 race condition을 애플리케이션 코드의 "먼저 SELECT" 만으로 막지 않고
-- DB 제약으로 강제한다 — 두 번째 INSERT는 unique_violation(23505)으로 거부된다.
create unique index if not exists uniq_active_recovery_code_per_report
  on report_recovery_codes(report_id)
  where revoked_at is null;

create table if not exists report_access_grants (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  guest_session_id uuid not null references guest_sessions(id) on delete cascade,
  grant_type text not null default 'RECOVERY_CODE',
  source_recovery_code_id uuid references report_recovery_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (guest_session_id, report_id)
);
create index if not exists idx_access_grants_report on report_access_grants(report_id);
create index if not exists idx_access_grants_session on report_access_grants(guest_session_id);
create index if not exists idx_access_grants_source_code on report_access_grants(source_recovery_code_id);

-- Rate limit 시도 기록. bucket_key 는 'session:<guest_session_id>' / 'ip:<hmac>' / 'global' 형태의
-- 애플리케이션 레벨 식별자 — 평문 IP는 어떤 컬럼에도 저장하지 않는다(애플리케이션에서 HMAC 처리 후 전달).
-- 보존기간(§17): 레이트리밋 판정에는 최근 창(15분~수 시간)만 필요하므로 무한 누적을 허용하지 않는다.
-- 애플리케이션이 opportunistic pruning(요청 처리 시 자기 bucket_key의 오래된 행 삭제)을 수행하고,
-- 그것만으로는 요청이 재발생하지 않는 과거 bucket_key가 영구히 남을 수 있어(§17 지적사항),
-- 추가로 이 함수를 이용한 전역 정리를 병행한다(별도 유료 스케줄러 없이 확률적 트리거로 호출).
create table if not exists report_recovery_attempts (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_recovery_attempts_bucket_created
  on report_recovery_attempts(bucket_key, created_at);
create index if not exists idx_recovery_attempts_created
  on report_recovery_attempts(created_at);

create or replace function prune_recovery_attempts_before(p_cutoff timestamptz)
returns void
language sql
as $$
  delete from report_recovery_attempts where created_at < p_cutoff;
$$;

-- RLS: 기존 커머스 테이블과 동일한 deny-all — service_role(서버)만 접근 가능.
alter table report_recovery_codes enable row level security;
alter table report_access_grants enable row level security;
alter table report_recovery_attempts enable row level security;

create policy "deny_all_report_recovery_codes" on report_recovery_codes for all using (false);
create policy "deny_all_report_access_grants" on report_access_grants for all using (false);
create policy "deny_all_report_recovery_attempts" on report_recovery_attempts for all using (false);

-- Recovery Code 발급/회전 원자적 처리 RPC.
-- 평문 코드나 HMAC 시크릿은 이 함수에 전달되지 않는다 — 해시 계산은 애플리케이션(Node crypto)에서
-- 이미 끝낸 code_hash 만 인자로 받는다(HMAC 알고리즘/시크릿을 DB 레이어에 이중 구현하지 않기 위함).
--
-- p_rotate = false 이고 활성 코드가 이미 있으면 RECOVERY_CODE_ALREADY_ISSUED 예외(errcode P2402).
-- p_rotate = true 이면: 기존 활성 코드 revoke -> 그 코드에서 파생된 access grant 전부 revoke
--   -> 새 코드 insert, 이 세 단계는 하나의 함수 호출(=하나의 트랜잭션)로 원자 처리된다.
-- 활성 코드가 없으면 p_rotate 값과 무관하게 그냥 새로 발급한다(회수할 대상이 없으므로 안전).
create or replace function issue_or_rotate_recovery_code(
  p_report_id uuid,
  p_order_id uuid,
  p_new_code_hash text,
  p_rotate boolean
) returns table (id uuid, report_id uuid, code_hash text, created_at timestamptz)
language plpgsql
as $$
declare
  v_existing_id uuid;
  v_now timestamptz := now();
  v_new_id uuid;
  v_new_created_at timestamptz;
begin
  select rc.id into v_existing_id
    from report_recovery_codes rc
    where rc.report_id = p_report_id and rc.revoked_at is null
    for update;

  if v_existing_id is not null and not p_rotate then
    raise exception 'RECOVERY_CODE_ALREADY_ISSUED' using errcode = 'P2402';
  end if;

  if v_existing_id is not null and p_rotate then
    update report_recovery_codes set revoked_at = v_now where id = v_existing_id;
    update report_access_grants
      set revoked_at = v_now
      where source_recovery_code_id = v_existing_id and revoked_at is null;
  end if;

  insert into report_recovery_codes (report_id, order_id, code_hash)
  values (p_report_id, p_order_id, p_new_code_hash)
  returning report_recovery_codes.id, report_recovery_codes.created_at
  into v_new_id, v_new_created_at;

  return query select v_new_id, p_report_id, p_new_code_hash, v_new_created_at;
end;
$$;
