-- P3.5 재능 씨앗 / 성장 행동+로드맵 / 감정·학습·관계 가이드 — paid_extras 확장.
--
-- reports.report_payload_json은 여기서도 절대 건드리지 않는다(불변 스냅샷 원칙,
-- p24Snapshot.test.ts §5의 정적 감사 대상). 전부 nullable 추가 컬럼이라 기존 행도
-- 안전하게 그대로 남는다(백필 불필요 — 읽는 쪽이 null을 "아직 없음"으로 처리).

alter table paid_extras
  add column if not exists talent_seeds_json jsonb,
  add column if not exists growth_content_json jsonb,
  add column if not exists guides_json jsonb;
