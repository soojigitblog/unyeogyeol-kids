// P2.4 PAID REPORT CONTENT INTEGRITY GATE — 영구 회귀 테스트
//
// 배경: 실제 12,900원 결제 리포트(엄마 × 정수지, discipline)에서 Chapter별로 서로 다른
// Concern/Rule 문구가 섞이는 심각한 버그가 발견됨:
//   1) mergeCaregiverReactionSentence 가 "재촉"+"자"(하자/가자 등 흔한 종결어미)만 보고
//      Concern과 무관하게 "잠자리로 가도록"을 끼워 넣음 (Sleep Template Leakage)
//   2) CH04/CH05 가 rule.interactionType==="collaborative" 일 때 실제 입력과 무관한
//      하드코딩 장면("새로운 환경에서 멈춰 서서 살핌")을 강제로 사용 (Chapter Context Mismatch)
//
// 이 테스트는 위 두 가지가 다시 발생하지 않는지 검증한다: CH01·CH04가 항상 같은 실제
// Current Conflict를 사용하고(Primary Interaction Lock), 입력하지 않은 Concern의
// 전용 어휘(잠자리/식탁/새로운 환경 등)가 절대 섞이지 않아야 한다(Concern Hard Lock).

import { describe, expect, it } from "vitest";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import type {
  Answers,
  CaregiverProfile,
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  MomAnswers,
} from "../types";

const child: ChildProfile = {
  name: "테스트아이",
  birthDate: "2023-01-01",
  birthTimeKnown: false,
  gender: "boy",
};
const caregiver: CaregiverProfile = {
  role: "mother",
  roleLabel: "엄마",
  birthDate: "1990-01-01",
  birthTimeKnown: false,
};
const answers: Answers = {
  new_environment: 2,
  transition: 3,
  self_assertion: 2,
};
const momAnswers: MomAnswers = {
  time_pressure_style: "opt_time_control",
  emotion_coping_style: "opt_emo_redirect",
};

/** Concern 별 금지 어휘(다른 Concern 전용 장면 단어). 실제 입력에 없다면 절대 등장 금지. */
const FORBIDDEN_TERMS_BY_CONCERN: Record<string, string[]> = {
  discipline: ["잠자리", "수면", "식탁", "음식", "숟가락", "새로운 환경", "낯선 곳"],
  tantrum: ["잠자리", "수면", "식탁", "음식", "숟가락", "새로운 환경", "낯선 곳"],
  stubborn: ["잠자리", "수면", "식탁", "음식", "숟가락", "새로운 환경", "낯선 곳"],
  learning: ["잠자리", "수면", "식탁", "음식", "숟가락", "새로운 환경", "낯선 곳"],
};

// 실제 결제 세션에서 버그를 발동시켰던 것과 동일한 유형의 입력:
// "재촉"이라는 단어 + "하자"(흔한 종결어미의 "자")가 함께 있는 문장.
const REGRESSION_MOM_REACT =
  "일과를 챙기기 위해 '빨리 하자, 늦었어' 하고 재촉함";
const REGRESSION_TYPICAL_PHRASE = "빨리 하자, 늦었어!";
const REGRESSION_CHILD_REACT = "하던 놀이나 방식을 멈추지 않고 계속 이어가려 함";
const REGRESSION_ESCALATION = "아이가 제자리에 멈춰 서서 버티며 실랑이가 길어짐";

function buildReport(concernId: ConcernId, overrides: Partial<CurrentConflictInput> = {}) {
  const conflictInput: CurrentConflictInput = {
    concernId,
    scenarioId: "sc_test",
    momFirstReaction: REGRESSION_MOM_REACT,
    momTypicalPhrase: REGRESSION_TYPICAL_PHRASE,
    childFirstReaction: REGRESSION_CHILD_REACT,
    subsequentEscalation: REGRESSION_ESCALATION,
    recentFrequency: "daily",
    ...overrides,
  };
  return generateSignatureReport(
    child,
    buildBehaviorEvidence(answers),
    buildMomEvidence(momAnswers),
    conflictInput,
    null,
    caregiver
  );
}

describe("P2.4 PAID REPORT CONTENT INTEGRITY GATE", () => {
  it("§1/§3 Primary Interaction Lock: CH01과 CH04는 항상 동일한 실제 장면을 사용한다", () => {
    const report = buildReport("discipline");

    expect(report.chapter01_recurringScene.narrative).toContain("빨리 하자, 늦었어");
    expect(report.chapter01_recurringScene.narrative).toContain(REGRESSION_ESCALATION);

    const stepTexts = report.chapter04_conflictChain.steps.map((s) => s.description).join(" ");
    // P2.5 CONTENT DENSITY 이후: CH04 는 CH01 장면을 그대로 다시 복사하지 않는다.
    // (같은 사실이 리포트 안에서 3회 이상 반복되던 원인이었다)
    // 대신 "같은 Current Conflict 에서 파생됐는가"를 검증한다 —
    // 원래 이 테스트가 막으려던 버그는 "CH04가 다른 Concern의 하드코딩 장면을 쓰는 것"이었다.
    expect(stepTexts).not.toContain("빨리 하자, 늦었어");
    expect(report.chapter04_conflictChain.steps[0].description).toBe(
      "일상의 규칙이나 할 일을 챙겨야 하는 순간."
    );
    expect(stepTexts).toContain(child.name!);
    expect(stepTexts).toContain(caregiver.roleLabel);
    // 다른 Concern 전용 장면이 섞이지 않는다.
    expect(stepTexts).not.toContain("잠자리");
    expect(stepTexts).not.toContain("숟가락");

    // CH02/CH05 도 같은 사실을 담아야 하며 서로 모순되지 않는다.
    expect(report.chapter02_perspectiveGap.momPerspective.intention).toContain("빨리 하자, 늦었어");
    expect(report.chapter05_momExhaustionPoint.exhaustionReason).toContain("빨리 하자, 늦었어");
  });

  it("§2/§6 Concern Hard Lock: '재촉'+흔한 종결어미(하자/가자)만으로 Sleep 문구가 섞이지 않는다", () => {
    // 이번에 실제로 터진 버그의 재현 케이스: discipline 인데 momReact에 "재촉함"과
    // "하자"(흔한 종결어미)가 들어 있어도 sleep 전용 문구("잠자리로 가도록")가 붙지 않아야 한다.
    for (const concernId of ["discipline", "tantrum", "stubborn", "learning"] as ConcernId[]) {
      const report = buildReport(concernId);
      const serialized = JSON.stringify(report);
      const forbidden = FORBIDDEN_TERMS_BY_CONCERN[concernId] ?? [];
      for (const term of forbidden) {
        expect(
          serialized.includes(term),
          `Concern=${concernId} 인데 금지 용어 "${term}" 가 등장함 (Cross-Concern Leakage)`
        ).toBe(false);
      }
    }
  });

  it("§2 Concern Hard Lock: sleep Concern일 때만 '잠자리로 가도록' 문구가 정상적으로 붙는다", () => {
    const sleepReport = buildReport("sleep");
    expect(sleepReport.chapter01_recurringScene.narrative).toContain("잠자리로 가도록");

    const disciplineReport = buildReport("discipline");
    expect(disciplineReport.chapter01_recurringScene.narrative).not.toContain("잠자리로 가도록");
  });

  it("§2 Concern Hard Lock: meal Concern이 아니면 '숟가락' 문구가 섞이지 않는다", () => {
    const mealReport = buildReport("meal", {
      momFirstReaction: "영양 생각에 '한 입만 먹어보자' 하고 숟가락을 건넴",
      momTypicalPhrase: "한 입만 먹어보자",
    });
    expect(mealReport.chapter01_recurringScene.narrative).toContain("숟가락");

    // 동일하게 "건넴"이라는 흔한 단어가 들어 있어도 meal이 아니면 숟가락 문구가 붙지 않는다.
    const disciplineReport = buildReport("discipline", {
      momFirstReaction: "장난감을 건넴",
      momTypicalPhrase: "이제 이거 하자",
    });
    expect(disciplineReport.chapter01_recurringScene.narrative).not.toContain("숟가락");
  });

  it("§4 LOW-FRICTION BRANCH LOCK: 실제 마찰 입력이 있으면 isCollaborative/isLowFriction 을 강제로 켜지 않는다", () => {
    const report = buildReport("discipline");
    expect(report.chapter04_conflictChain.isCollaborative).toBe(false);
    expect(report.chapter05_momExhaustionPoint.isLowFriction).toBe(false);
    // 근거 없는 "잘 맞는 지점" 안심 문구를 만들지 않는다.
    expect(report.chapter05_momExhaustionPoint.title).not.toBe("지금 우리 둘이 잘 맞는 지점");
    expect(JSON.stringify(report)).not.toContain("큰 마찰 없이 이어지고");
  });

  it("§7 CUSTOMER COPY QUALITY: misalignedPoint에 'Concern label의 방향' 같은 어색한 카테고리 삽입이 없다", () => {
    const report = buildReport("learning");
    expect(report.twoPersonSummary?.misalignedPoint).not.toMatch(/의 방향과.*고유한 속도가 만나는 지점/);
    // P2.5 CONTENT DENSITY 이후: SECTION 01 은 장면 원문을 다시 인용하지 않는다
    // (장면 전문은 SECTION 02 에 한 번만 나온다). 대신 두 사람이 움직이는 방향의
    // 대비로 서술하며, 여전히 두 사람이 모두 등장해야 한다.
    expect(report.twoPersonSummary?.misalignedPoint).not.toContain("빨리 하자, 늦었어");
    expect(report.twoPersonSummary?.misalignedPoint).toContain(child.name!);
    expect(report.twoPersonSummary?.misalignedPoint).toContain(caregiver.roleLabel);
  });
});
