// P2.2V.7 — REAL END-TO-END HUMAN VALUE & LAUNCH READINESS GATE
// 5 역할 × 5 Concern + 관계명 오염 + 내부 코드 노출 + Free/Paid 분리 검증

import { describe, expect, it } from "vitest";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildFoodEvidence } from "../questionnaire/foodQuestions";
import { CONFLICT_SCENARIOS } from "./conflictScenarios";
import type {
  CaregiverProfile,
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  SignatureReport,
} from "../types";

const childProfile: ChildProfile = {
  name: "열무",
  birthDate: "2024-04-15",
  birthTimeKnown: true,
  birthTime: "09:30",
  gender: "boy",
};

const childAnswers = {
  new_environment: 1 as const,
  transition: 1 as const,
  self_assertion: 2 as const,
  emotional_expression: 2 as const,
};

const momAnswers = {
  time_pressure_style: "opt_time_control",
  emotion_coping_style: "opt_emo_explain",
  instruction_resistance_style: "opt_inst_firm",
  routine_flexibility_style: "opt_rout_replan",
  conflict_recovery_style: "opt_rec_repair",
};

const ROLES: Array<{ caseId: string; profile: CaregiverProfile; forbidden: string[] }> = [
  {
    caseId: "A_엄마",
    profile: { role: "mother", roleLabel: "엄마", birthDate: "1991-08-20", birthTimeKnown: false },
    forbidden: ["아빠", "할머니", "외할머니", "이모", "큰이모", "삼촌"],
  },
  {
    caseId: "B_아빠",
    profile: { role: "father", roleLabel: "아빠", birthDate: "1990-03-11", birthTimeKnown: false },
    forbidden: ["엄마", "할머니", "외할머니", "이모", "큰이모"],
  },
  {
    caseId: "C_외할머니",
    profile: {
      role: "maternal_grandmother",
      roleLabel: "외할머니",
      birthDate: "1961-06-02",
      birthTimeKnown: false,
    },
    forbidden: ["엄마", "아빠", "이모", "큰이모"],
  },
  {
    caseId: "D_이모",
    profile: { role: "aunt", roleLabel: "이모", birthDate: "1994-01-20", birthTimeKnown: false },
    forbidden: ["엄마", "아빠", "할머니", "외할머니", "큰이모"],
  },
  {
    caseId: "E_큰이모",
    profile: {
      role: "other",
      roleLabel: "큰이모",
      birthDate: "1988-12-05",
      birthTimeKnown: false,
    },
    forbidden: ["엄마", "아빠", "할머니", "외할머니", "이모"],
  },
];

const CORE_CONCERNS = ["meal", "tantrum", "discipline", "shyness", "sleep"] as const;
type CoreConcernId = (typeof CORE_CONCERNS)[number];

const CORE_CONCERN_DATA = {
  meal: {
    label: "식습관/편식",
    scenarioId: "sc_meal_new_food_reject",
    childReact: "처음 보는 반찬을 보자마자 입을 닫고 밀어냄",
    momReact: "영양 생각에 '한 입만 먹어보자' 하고 숟가락을 건넴",
    escalation: "아이가 고개를 돌리며 숟가락을 밀치고 식탁 분위기가 굳어짐",
    phrase: "한 입만 먹어보자, 진짜 맛있어",
    keywords: ["식사", "반찬", "음식", "식탁"],
    wrongKeywords: ["신발", "놀이터", "외출 준비"],
  },
  tantrum: {
    label: "떼쓰기/울음",
    scenarioId: "sc_tantrum_frustration",
    childReact: "뜻대로 되지 않자 크게 울며 바닥에 앉음",
    momReact: "'울지 말고 천천히 이야기해봐' 하며 이유를 설명함",
    escalation: "아이가 감정을 가라앉히지 못하고 울음이 이어짐",
    phrase: "울지 말고 천천히 이야기해봐",
    keywords: ["울", "감정"],
    wrongKeywords: ["식탁", "반찬"],
  },
  discipline: {
    label: "훈육/규칙",
    scenarioId: "sc_discipline_instruction",
    childReact: "양치하라는 말에 '내가 할 거야' 하며 거부함",
    momReact: "'지금 해야 할 시간이야, 어서 해' 하고 단호하게 안내함",
    escalation: "아이가 자기 방식을 고집하며 실랑이가 길어짐",
    phrase: "지금 해야 할 시간이야, 어서 해",
    keywords: ["규칙", "양치"],
    wrongKeywords: ["식탁", "반찬"],
  },
  shyness: {
    label: "낯가림/수줍음",
    scenarioId: "sc_shyness_hesitation",
    childReact: "새로운 사람 앞에서 뒤로 숨고 굳어짐",
    momReact: "'어서 가서 인사해보자' 하고 참여를 권함",
    escalation: "아이가 계속 곁에 머물며 권유가 반복됨",
    phrase: "어서 가서 인사해보자",
    keywords: ["낯", "인사", "새로운"],
    wrongKeywords: ["식탁", "반찬"],
  },
  sleep: {
    label: "수면/잠자리",
    scenarioId: "sc_sleep_bedtime_delay",
    childReact: "잠자리에 눕기 싫어하며 '아직 안 졸려'라고 말함",
    momReact: "'이제 자야 할 시간이야, 빨리 누워' 하고 재촉함",
    escalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
    phrase: "이제 자야 할 시간이야, 빨리 누워",
    keywords: ["잠", "잠자리", "침대"],
    wrongKeywords: ["식탁", "반찬"],
  },
} as const;

function buildConflict(concernId: CoreConcernId): CurrentConflictInput {
  const c = CORE_CONCERN_DATA[concernId];
  return {
    concernId,
    scenarioId: c.scenarioId,
    childFirstReaction: c.childReact,
    momFirstReaction: c.momReact,
    subsequentEscalation: c.escalation,
    recentFrequency: "several_times_a_week",
    momTypicalPhrase: c.phrase,
  };
}

function buildReport(caregiver: CaregiverProfile, concernId: CoreConcernId) {
  const childEv = buildBehaviorEvidence(childAnswers);
  const foodEv =
    concernId === "meal"
      ? buildFoodEvidence({
          new_food_reaction: "inspect_smell_shape",
          preference_balance: "favorite_only_first",
          prompt_response: "stronger_refusal_on_prompt",
          meal_flow_block: "put_down_spoon_divert",
        })
      : [];
  return generateSignatureReport(
    childProfile,
    [...childEv, ...foodEv],
    buildMomEvidence(momAnswers),
    buildConflict(concernId),
    null,
    caregiver
  );
}

/** 고객 노출 문구만 추출 (evidenceRefs 등 내부 필드 제외) */
function extractCustomerCopy(report: SignatureReport): string {
  const parts: string[] = [
    report.meta.concernLabel,
    report.meta.caregiverRoleLabel ?? "",
    report.meta.momName ?? "",
    report.twoPersonSummary?.childSummary ?? "",
    report.twoPersonSummary?.momSummary ?? "",
    report.twoPersonSummary?.misalignedPoint ?? "",
    report.twoPersonSummary?.fortuneRelationshipHint ?? "",
    report.chapter01_recurringScene.narrative,
    report.chapter01_recurringScene.title,
    report.chapter02_perspectiveGap.momPerspective.intention,
    report.chapter02_perspectiveGap.momPerspective.possibleFeeling,
    report.chapter02_perspectiveGap.childPerspective.possibleInterpretation,
    report.chapter03_interactionPattern.synthesis,
    report.chapter03_interactionPattern.childBehaviorAspect,
    report.chapter03_interactionPattern.momReactionAspect,
    report.chapter04_conflictChain.whereToBreak.breakActionTitle,
    report.chapter04_conflictChain.whereToBreak.breakActionDetail,
    report.chapter05_momExhaustionPoint.exhaustionReason,
    report.chapter05_momExhaustionPoint.comfortMessage,
    report.chapter08_corePromise.oneSentenceAnchor,
    ...report.chapter04_conflictChain.steps.map((s) => s.description),
    ...report.chapter06_threePhrases.map((p) => `${p.before}${p.after}${p.whyItMayHelp}`),
    ...report.chapter07_threeActions.map((a) => `${a.actionTitle}${a.actionDetail}`),
    ...(report.fortuneRelationship?.childHints ?? []),
    ...(report.fortuneRelationship?.momHints ?? []),
    report.fortuneRelationship?.reflectionText ?? "",
    report.fortuneRelationship?.observationContrastText ?? "",
  ];
  return parts.join("\n");
}

const BANNED_INTERNAL = [
  "Mock",
  "Fixture",
  "QA",
  "DEV",
  "Evidence",
  "LOW",
  "MEDIUM",
  "STRONG",
  "child:",
  "mom:",
  "caregiver:",
  "rule_",
  "REFLECTIVE",
  "DIRECT",
  "TRANSFERRED_LOW",
  "undefined",
  "null",
  "{{CG",
];

const BROKEN_JOSA = ["아빠이", "할머니가는", "이모이", "삼촌가", "큰이모이", "외할머니이"];

/** '큰이모' 안의 '이모' 같은 부분 문자열 오탐 방지 */
function hasStandaloneLabel(text: string, label: string): boolean {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![가-힣])${escaped}(?![가-힣])`).test(text);
}

describe("P2.2V.7 Launch Readiness Gate", () => {
  it("1. 5 역할 × 5 Concern — 관계명 유지 + Concern 정합 + 내부 코드 0", () => {
    for (const role of ROLES) {
      for (const concernId of CORE_CONCERNS) {
        const report = buildReport(role.profile, concernId);
        const copy = extractCustomerCopy(report);
        const c = CORE_CONCERN_DATA[concernId];

        expect(report.meta.caregiverRoleLabel).toBe(role.profile.roleLabel);

        for (const forbidden of role.forbidden) {
          expect(hasStandaloneLabel(copy, forbidden)).toBe(false);
        }

        expect(copy).toContain(role.profile.roleLabel);

        for (const kw of c.keywords) {
          expect(
            report.chapter01_recurringScene.narrative.includes(kw) ||
              report.chapter01_recurringScene.sceneKeywords.some((k) => k.includes(kw)) ||
              copy.includes(kw)
          ).toBe(true);
        }

        for (const wrong of c.wrongKeywords) {
          expect(report.chapter01_recurringScene.narrative).not.toContain(wrong);
        }

        for (const banned of BANNED_INTERNAL) {
          expect(copy).not.toContain(banned);
        }

        for (const broken of BROKEN_JOSA) {
          expect(copy).not.toContain(broken);
        }

        expect(report.chapter04_conflictChain.steps[2].description).toContain(c.phrase.split(",")[0].replace(/'/g, ""));
      }
    }
  });

  it("2. 대표 조합 5종 — 역할×Concern 동시 정합", () => {
    const combos: Array<{ role: typeof ROLES[number]; concern: CoreConcernId }> = [
      { role: ROLES[0], concern: "meal" },
      { role: ROLES[1], concern: "discipline" },
      { role: ROLES[2], concern: "shyness" },
      { role: ROLES[3], concern: "tantrum" },
      { role: ROLES[4], concern: "sleep" },
    ];

    for (const { role, concern } of combos) {
      const report = buildReport(role.profile, concern);
      const copy = extractCustomerCopy(report);
      expect(copy).toContain(role.profile.roleLabel);
      expect(report.meta.concernLabel).toContain(
        CORE_CONCERN_DATA[concern].label.split("/")[0]
      );
      for (const forbidden of role.forbidden) {
        expect(hasStandaloneLabel(copy, forbidden)).toBe(false);
      }
    }
  });

  it("3. Two Person Summary 4층 분리 — 출생정보 힌트 포함", () => {
    const report = buildReport(ROLES[1].profile, "meal");
    expect(report.twoPersonSummary).toBeDefined();
    expect(report.twoPersonSummary!.childSummary.length).toBeGreaterThan(0);
    expect(report.twoPersonSummary!.momSummary.length).toBeGreaterThan(0);
    expect(report.twoPersonSummary!.misalignedPoint.length).toBeGreaterThan(0);
    expect(report.fortuneRelationship).toBeDefined();
    expect(report.fortuneRelationship!.childHints.length).toBeGreaterThan(0);
    expect(report.fortuneRelationship!.momHints[0]).toContain("아빠");
  });

  it("4. Conflict Chain — 사용자 입력 기반 (장면 창작 0)", () => {
    const report = buildReport(ROLES[0].profile, "meal");
    const chain = report.chapter04_conflictChain.steps;
    expect(chain[1].description).toContain("처음 보는 반찬");
    expect(chain[2].description).toContain("한 입만");
    expect(chain[3].description).toContain("숟가락");
    expect(chain.length).toBe(4);
  });

  it("5. Before/After — 효과 단정 금지 패턴", () => {
    const report = buildReport(ROLES[0].profile, "meal");
    const phrase = report.chapter06_threePhrases[0];
    expect(phrase.whyItMayHelp).not.toMatch(/긴장을 낮추|내적 동기|단단해/);
    expect(phrase.whyItMayHelp).toMatch(/선택지|살펴보|열어/);
  });

  it("6. Concern Scenario catalog — concernId 일치", () => {
    for (const concernId of CORE_CONCERNS) {
      const scenarios = CONFLICT_SCENARIOS.filter((s) => s.concernId === concernId);
      expect(scenarios.length).toBeGreaterThan(0);
      const conflict = buildConflict(concernId);
      expect(scenarios.some((s) => s.scenarioId === conflict.scenarioId)).toBe(true);
    }
  });

  it("7. Fixture 이름 유출 0 — QA fixture 아이 이름 미포함", () => {
    const report = buildReport(ROLES[4].profile, "sleep");
    const copy = extractCustomerCopy(report);
    for (const name of ["민준", "서연", "도윤", "하은", "지호"]) {
      expect(copy).not.toContain(name);
    }
  });
});
