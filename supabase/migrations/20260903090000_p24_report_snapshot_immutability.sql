-- P2.4 REAL COMMERCE FOUNDATION — PAID REPORT SNAPSHOT IMMUTABILITY
--
-- 결제 완료(Report.status = 'UNLOCKED')된 리포트의 report_payload_json /
-- report_version 은 이후 어떤 경로로도 바뀌면 안 된다. 새 코드나 새 Rule로
-- generator 가 바뀌어도, 이미 구매한 고객이 본 결과가 조용히 달라지는 일이
-- 없어야 한다.
--
-- service_role 키는 RLS는 우회하지만 트리거는 우회하지 않으므로,
-- 애플리케이션 코드 실수(또는 향후 "재생성" 기능이 실수로 붙는 경우)에도
-- DB 레벨에서 최종적으로 막아준다.

create or replace function prevent_paid_report_payload_change()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'UNLOCKED' then
    if new.report_payload_json is distinct from old.report_payload_json then
      raise exception 'report_payload_json is immutable once report % is UNLOCKED (paid)', old.id
        using errcode = 'P2401';
    end if;
    if new.report_version is distinct from old.report_version then
      raise exception 'report_version is immutable once report % is UNLOCKED (paid)', old.id
        using errcode = 'P2401';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_paid_report_payload_change on reports;

create trigger trg_prevent_paid_report_payload_change
  before update on reports
  for each row
  execute function prevent_paid_report_payload_change();
