// P2.4 PAID REPORT RECOMMENDATION ALIGNMENT — 영구 회귀 테스트
//
// 목적: CH06(오늘 바꿔볼 말)·CH07(오늘 해볼 행동)·CH08(관계의 약속)이 일반 InteractionRule
// 예시가 아니라 CurrentConflict.scenarioId 기반 실제 장면에서 나오는지 검증한다.
// 핵심: "이 조언이 다른 고객/다른 Concern에도 그대로 쓸 수 있는가?" 를 실측한다.

import { describe, expect, it } from "vitest";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildFoodEvidence } from "../questionnaire/foodQuestions";
import { SCENARIO_RECOMMENDATIONS } from "./scenarioRecommendations";
import { CONFLICT_SCENARIOS } from "./conflictScenarios";
import type { CaregiverProfile, ChildProfile, CurrentConflictInput } from "../types";

const GENERIC_BANNED_PHRASES = [
  "아이의 의견을 존중해주세요",
  "서로의 생각을 나눠보세요",
  "편안한 대화를 만들어보세요",
  "아이의 마음을 먼저 들어주세요",
  "차분하게 기다려주세요",
];

const CASE_A_CHILD: ChildProfile = { name: "정수지", birthDate: "2023-06-01", birthTimeKnown: false, gender: "girl" };
const CASE_A_CAREGIVER: CaregiverProfile = { role: "mother", roleLabel: "엄마", birthDate: "1990-01-01", birthTimeKnown: false };
const CASE_A_CONFLICT: CurrentConflictInput = {
  concernId: "discipline",
  scenarioId: "sc_discipline_instruction",
  childFirstReaction: "하던 놀이나 방식을 멈추지 않고 계속 이어가려 함",
  momFirstReaction: "빨리 하자, 늦었어 하고 재촉함",
  subsequentEscalation: "아이가 제자리에 멈춰 서서 버티며 실랑이가 길어짐",
  recentFrequency: "daily",
  momTypicalPhrase: "빨리 하자, 늦었어",
};

const CASE_B_CHILD: ChildProfile = { name: "하람", birthDate: "2023-03-15", birthTimeKnown: false, gender: "girl" };
const CASE_B_CAREGIVER: CaregiverProfile = { role: "father", roleLabel: "아빠", birthDate: "1990-05-20", birthTimeKnown: false };
const CASE_B_CONFLICT: CurrentConflictInput = {
  concernId: "sleep",
  scenarioId: "sc_sleep_bedtime_delay",
  childFirstReaction: "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함",
  momFirstReaction: "이제 자야 할 시간이야, 빨리 누워 하고 재촉함",
  subsequentEscalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
  recentFrequency: "several_times_a_week",
  momTypicalPhrase: "이제 자야 할 시간이야, 빨리 누워",
};

const CASE_C_CHILD: ChildProfile = {
  name: "열무",
  birthDate: "2024-04-15",
  birthTimeKnown: true,
  birthTime: "09:30",
  gender: "boy",
};
const CASE_C_CAREGIVER: CaregiverProfile = {
  role: "maternal_grandmother",
  roleLabel: "외할머니",
  birthDate: "1961-06-02",
  birthTimeKnown: false,
};
const CASE_C_CONFLICT: CurrentConflictInput = {
  concernId: "meal",
  scenarioId: "sc_meal_new_food_reject",
  childFirstReaction: "처음 보는 반찬을 보자마자 입을 닫고 밀어냄",
  momFirstReaction: "영양 생각에 한 입만 먹어보자 하고 숟가락을 건넴",
  subsequentEscalation: "아이가 고개를 돌리며 숟가락을 밀치고 식탁 분위기가 굳어짐",
  recentFrequency: "daily",
  momTypicalPhrase: "한 입만 먹어보자, 진짜 맛있어",
};

function buildCaseA() {
  return generateSignatureReport(
    CASE_A_CHILD,
    buildBehaviorEvidence({ new_environment: 2, transition: 1, self_assertion: 4 }),
    buildMomEvidence({ time_pressure_style: "opt_time_control", instruction_resistance_style: "opt_inst_firm" }),
    CASE_A_CONFLICT,
    null,
    CASE_A_CAREGIVER
  );
}

function buildCaseB() {
  return generateSignatureReport(
    CASE_B_CHILD,
    buildBehaviorEvidence({ new_environment: 2, transition: 2, self_assertion: 2 }),
    buildMomEvidence({ time_pressure_style: "opt_time_control", instruction_resistance_style: "opt_inst_firm" }),
    CASE_B_CONFLICT,
    null,
    CASE_B_CAREGIVER
  );
}

function buildCaseC() {
  const foodAnswers = {
    new_food_reaction: "inspect_smell_shape" as const,
    preference_balance: "leave_unfamiliar" as const,
    prompt_response: "shake_head_close_mouth" as const,
    meal_flow_block: "put_down_spoon_divert" as const,
  };
  const childEv = [
    ...buildBehaviorEvidence({ new_environment: 2, self_assertion: 4 }),
    ...buildFoodEvidence(foodAnswers),
  ];
  return generateSignatureReport(
    CASE_C_CHILD,
    childEv,
    buildMomEvidence({ time_pressure_style: "opt_time_control", instruction_resistance_style: "opt_inst_firm" }),
    CASE_C_CONFLICT,
    null,
    CASE_C_CAREGIVER
  );
}

describe("P2.4 PAID REPORT RECOMMENDATION ALIGNMENT", () => {
  it("TEST A: 엄마×정수지×훈육 — CH06/07/08 이 실제 장면(빨리 하자/멈춰 서서 버팀)에 맞는다", () => {
    const report = buildCaseA();
    const phrase = report.chapter06_threePhrases[0];
    // Before 는 실제 momTypicalPhrase 그대로 (지어낸 대사 아님)
    expect(phrase.before).toContain("빨리 하자");
    // After 는 discipline 실제 장면(마무리 지점 선택)에 맞는 제안
    expect(phrase.after).toContain("마무리");
    expect(report.chapter07_threeActions.length).toBeGreaterThanOrEqual(2);
    expect(report.chapter08_corePromise.oneSentenceAnchor).toContain("빨리 하자");
    expect(report.chapter08_corePromise.oneSentenceAnchor).toContain("마지막 지점");

    // Cross-Concern Leakage: 잠자리/식탁/새로운 환경 등 다른 Concern 전용 표현 없음
    const copy = JSON.stringify([report.chapter06_threePhrases, report.chapter07_threeActions, report.chapter08_corePromise]);
    ["잠자리", "식탁", "숟가락", "새로운 환경"].forEach((leak) => expect(copy).not.toContain(leak));
  });

  it("TEST B: 아빠×하람×수면 — CH06/07/08 이 실제 장면(잠자리 지연)에 맞는다", () => {
    const report = buildCaseB();
    const phrase = report.chapter06_threePhrases[0];
    expect(phrase.before).toContain("빨리 누워");
    expect(phrase.after).toContain("눕자");
    expect(report.chapter08_corePromise.oneSentenceAnchor).toContain("잠자리");

    const copy = JSON.stringify([report.chapter06_threePhrases, report.chapter07_threeActions, report.chapter08_corePromise]);
    ["식탁", "숟가락", "훈육", "새로운 환경을 마주"].forEach((leak) => expect(copy).not.toContain(leak));
  });

  it("TEST C: 외할머니×열무×식습관 — CH06/07/08 이 실제 장면(새 음식 거부)에 맞는다", () => {
    const report = buildCaseC();
    const phrase = report.chapter06_threePhrases[0];
    expect(phrase.before).toContain("한 입만 먹어보자");
    expect(phrase.after).toContain("냄새");
    expect(report.chapter08_corePromise.oneSentenceAnchor).toContain("음식");

    const copy = JSON.stringify([report.chapter06_threePhrases, report.chapter07_threeActions, report.chapter08_corePromise]);
    ["잠자리", "훈육", "빨리 하자"].forEach((leak) => expect(copy).not.toContain(leak));
    // 관계 일반화 회귀: 외할머니 케이스에 다른 호칭이 섞이지 않는다
    expect(copy).not.toContain("엄마");
  });

  it("TEST: Traceability — scenarioId 매칭 시 evidenceRefs 에 근거 출처가 남는다(고객 비노출)", () => {
    const report = buildCaseA();
    const refs = report.chapter06_threePhrases[0].evidenceRefs ?? [];
    expect(refs).toContain(`scenario:${CASE_A_CONFLICT.scenarioId}`);
    expect(refs).toContain("source:scenario");
    expect(refs).toContain(`concern:${CASE_A_CONFLICT.concernId}`);
  });

  it("TEST: Generic Fallback Leakage — 30개 시나리오 콘텐츠 전체에 금지 범용 문구가 없다", () => {
    const bank = JSON.stringify(SCENARIO_RECOMMENDATIONS);
    GENERIC_BANNED_PHRASES.forEach((phrase) => {
      expect(bank).not.toContain(phrase);
    });
  });

  it("TEST: 모든 시나리오는 최소 2개의 Action을 제공한다(§5)", () => {
    Object.entries(SCENARIO_RECOMMENDATIONS).forEach(([scenarioId, rec]) => {
      expect(rec.actions.length, `${scenarioId} actions`).toBeGreaterThanOrEqual(2);
      expect(rec.phraseAfter.length, `${scenarioId} phraseAfter`).toBeGreaterThan(0);
      expect(rec.anchor.length, `${scenarioId} anchor`).toBeGreaterThan(0);
    });
  });

  it("TEST: conflictScenarios.ts 에 정의된 모든 scenarioId 가 추천 콘텐츠를 갖는다(커버리지 100%)", () => {
    const missing = CONFLICT_SCENARIOS.filter((s) => !SCENARIO_RECOMMENDATIONS[s.scenarioId]).map(
      (s) => s.scenarioId
    );
    expect(missing).toEqual([]);
  });

  it("TEST: 같은 scenarioId 면 mom 미니체크 세부 응답이 달라져도 CH06/07/08 이 흔들리지 않는다(Primary Lock)", () => {
    const reportPace = buildCaseA();
    const reportExplain = generateSignatureReport(
      CASE_A_CHILD,
      buildBehaviorEvidence({ new_environment: 2, transition: 1, self_assertion: 4 }),
      buildMomEvidence({ time_pressure_style: "opt_time_notify", emotion_coping_style: "opt_emo_explain" }),
      CASE_A_CONFLICT,
      null,
      CASE_A_CAREGIVER
    );
    expect(reportExplain.chapter06_threePhrases[0].after).toBe(reportPace.chapter06_threePhrases[0].after);
    expect(reportExplain.chapter08_corePromise.oneSentenceAnchor).toBe(
      reportPace.chapter08_corePromise.oneSentenceAnchor
    );
  });
});
