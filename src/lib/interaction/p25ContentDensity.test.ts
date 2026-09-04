// P2.5 PAID REPORT CONTENT DENSITY REWRITE — 검수 테스트
//
// 목적 (§16 코드보다 실제 결과 우선):
//   1) 고객이 실제로 보는 문구 전문을 그대로 출력한다 (사람이 읽고 판단하기 위함).
//   2) 그 "고객 화면 텍스트"에 대해서만 중복/번호/누수/근거없는심리 검사를 돌린다.
//
// 중요: 검사 대상은 SignatureReport 객체 전체가 아니라, page.tsx 가 실제로 렌더링하는
// Section 만 모은 텍스트다. 화면에 나오지 않는 레거시 필드(chapter02/03/05)는 제외한다.

import { writeFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import type {
  BehaviorEvidence,
  CaregiverProfile,
  ChildProfile,
  CurrentConflictInput,
  MomAnswers,
  SignatureReport,
} from "@/lib/types";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { buildShareSummaryText } from "@/lib/purchase/sharePayload";
import { subj } from "@/lib/caregiver";

interface DensityCase {
  label: string;
  childProfile: ChildProfile;
  caregiverProfile: CaregiverProfile;
  childEvidences: BehaviorEvidence[];
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput;
}

const CASES: DensityCase[] = [
  // ── A. 엄마 × 정수지 × 훈육/규칙 거부 ──────────────────
  {
    label: "A. 엄마 × 정수지 × 훈육/규칙 거부",
    caregiverProfile: {
      role: "mother",
      roleLabel: "엄마",
      birthDate: "1992-03-08",
      birthTimeKnown: true,
      birthTime: "09:20",
    },
    childProfile: {
      name: "정수지",
      birthDate: "2022-06-11",
      birthTimeKnown: true,
      birthTime: "14:10",
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "transition",
        axis: "transition_preference",
        patternId: "needs_completion_before_transition",
        observedLabel: "하던 놀이를 끝맺은 뒤 이동하려는 모습",
        strength: "medium",
        source: { scope: "general", questionIds: ["q4_transition"] },
      },
      {
        domain: "self_assertion",
        axis: "strong_self_direction",
        patternId: "strong_independent_preference",
        observedLabel: "자기가 직접 고르고 이끌고자 하는 태도",
        strength: "medium",
        source: { scope: "general", questionIds: ["q3_self_assertion"] },
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
    },
    conflictInput: {
      concernId: "discipline",
      scenarioId: "sc_discipline_instruction",
      childFirstReaction: "장난감 정리를 하라고 하면 하던 놀이를 계속 이어가려 함",
      momFirstReaction: "'이제 그만하고 정리하자'라고 말하며 재촉함",
      subsequentEscalation: "아이가 대답만 하고 자리에서 움직이지 않아 실랑이가 길어짐",
      recentFrequency: "daily",
      momTypicalPhrase: "이제 그만하고 정리하자",
    },
  },

  // ── B. 아빠 × 하람 × 수면 ─────────────────────────────
  {
    label: "B. 아빠 × 하람 × 수면/잠자리",
    caregiverProfile: {
      role: "father",
      roleLabel: "아빠",
      birthDate: "1989-11-23",
      birthTimeKnown: true,
      birthTime: "21:40",
    },
    childProfile: {
      name: "하람",
      birthDate: "2021-09-02",
      birthTimeKnown: true,
      birthTime: "07:55",
      gender: "boy",
    },
    childEvidences: [
      {
        domain: "sleep_bedtime",
        patternId: "sleep_transition_needs_completion",
        observedLabel: "잠자리 전 하던 활동을 마무리하려는 모습",
        strength: "medium",
        source: {
          scope: "concern_micro",
          concernId: "sleep",
          questionIds: ["sleep_bedtime_transition"],
        },
      },
      {
        domain: "sleep_prebed",
        patternId: "sleep_prebed_continues_activity",
        observedLabel: "누운 뒤에도 활동을 이어가려는 모습",
        strength: "medium",
        source: {
          scope: "concern_micro",
          concernId: "sleep",
          questionIds: ["sleep_pre_sleep"],
        },
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
    },
    conflictInput: {
      concernId: "sleep",
      scenarioId: "sc_sleep_bedtime_delay",
      childFirstReaction: "잘 시간이 되어도 눕지 않고 하던 자동차 놀이를 계속 이어가려 함",
      momFirstReaction: "'이제 불 끌 거야, 빨리 누워'라고 말하며 재촉함",
      subsequentEscalation: "아이가 누웠다가 다시 일어나 놀이를 찾으며 잠들기를 미룸",
      recentFrequency: "daily",
      momTypicalPhrase: "이제 불 끌 거야, 빨리 누워",
    },
  },

  // ── C. 외할머니 × 열무 × 식습관 ───────────────────────
  {
    label: "C. 외할머니 × 열무 × 식습관/편식",
    caregiverProfile: {
      role: "maternal_grandmother",
      roleLabel: "외할머니",
      birthDate: "1960-04-17",
      birthTimeKnown: false,
    },
    childProfile: {
      name: "열무",
      birthDate: "2022-12-05",
      birthTimeKnown: true,
      birthTime: "11:05",
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "food_prompt_response",
        patternId: "stronger_refusal_on_prompt",
        observedLabel: "권하면 더 분명하게 거부하는 모습",
        strength: "medium",
        source: {
          scope: "concern_micro",
          concernId: "meal",
          questionIds: ["food_prompt_response"],
        },
      },
      {
        domain: "food_new_food",
        patternId: "inspect_smell_shape",
        observedLabel: "낯선 음식을 먼저 살펴보는 모습",
        strength: "medium",
        source: {
          scope: "concern_micro",
          concernId: "meal",
          questionIds: ["food_new_food"],
        },
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_notify",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
    },
    conflictInput: {
      concernId: "meal",
      scenarioId: "sc_meal_force_refusal",
      childFirstReaction: "한 입만 더 먹으라고 권하면 고개를 돌리며 더 분명히 거부함",
      momFirstReaction: "'한 입만 더 먹자'라고 말하며 숟가락을 건넴",
      subsequentEscalation: "아이가 손으로 숟가락을 밀어내며 거부가 더 완강해짐",
      recentFrequency: "several_times_a_week",
      momTypicalPhrase: "한 입만 더 먹자",
    },
  },
];

// ── 고객 화면에 실제로 렌더링되는 텍스트만 모은다 ────────
// page.tsx 의 Section 순서와 1:1 로 맞춘다.
function renderCustomerCopy(report: SignatureReport): string {
  const out: string[] = [];
  const child = report.meta.childName;
  const cg = report.meta.caregiverRoleLabel;
  const momDisplay = report.meta.momName || cg;

  out.push("[표지]");
  out.push(`${momDisplay} × ${child} · 고민: ${report.meta.concernLabel}`);
  out.push(
    `${subj(child)} 움직이는 방식과 ${subj(momDisplay)} 반응하는 방식이 어디에서 만나고 엇갈리는지 직접 알려주신 장면을 바탕으로 살펴봤어요.`
  );

  const s = report.twoPersonSummary;
  if (s) {
    out.push("");
    out.push("[01 한눈에 보는 우리 둘]");
    out.push(`${child}에게서 관찰된 모습: ${s.childKeywords.map((k) => `#${k}`).join(" ")}`);
    out.push(s.childSummary);
    out.push(`${cg}의 이번 체크에서 보인 반응: ${s.momKeywords.map((k) => `#${k}`).join(" ")}`);
    out.push(s.momSummary);
    out.push(`★ 우리 둘이 자주 엇갈리는 지점: ${s.misalignedPoint}`);
    if (s.fortuneRelationshipHint) out.push(`[보조 힌트] ${s.fortuneRelationshipHint}`);
  }

  out.push("");
  out.push("[02 실제로 반복되는 장면]");
  out.push(report.chapter01_recurringScene.title);
  out.push(report.chapter01_recurringScene.narrative);
  out.push(report.chapter01_recurringScene.sceneKeywords.map((k) => `#${k}`).join(" "));

  if (report.insightMechanism) {
    out.push("");
    out.push("[03 왜 이 장면이 자꾸 길어질까]");
    out.push(`1. 처음 목표와 마지막에 남은 것\n${report.insightMechanism.focusShift}`);
    out.push(`2. 길이가 늘어나기 시작하는 칸\n${report.insightMechanism.escalationPoint}`);
    out.push(`3. 그래서 실제로 바꿀 수 있는 것\n${report.insightMechanism.smallestLever}`);
  }

  out.push("");
  out.push("[04 가장 먼저 바꿔볼 한 지점]");
  out.push(report.chapter04_conflictChain.title ?? "");
  out.push("전부 바꾸지 않아도 돼요. 이 흐름에서 지금 바꿀 수 있는 칸은 하나입니다.");
  report.chapter04_conflictChain.steps.forEach((st) => {
    out.push(`${st.stepNumber}. [${st.actor}] ${st.description}`);
  });
  if (report.breakPointWhy) out.push(`왜 이 칸인가요?\n${report.breakPointWhy}`);
  out.push(
    `★ 여기서 갈등의 고리를 끊어볼 수 있어요\n${report.chapter04_conflictChain.whereToBreak.breakActionTitle}\n${report.chapter04_conflictChain.whereToBreak.breakActionDetail}`
  );

  out.push("");
  out.push("[05 다음번에 실제로 이렇게]");
  report.chapter06_threePhrases.forEach((p) => {
    out.push(`상황: ${p.situation}`);
    out.push(`BEFORE: ${p.before}`);
    out.push(`AFTER: ${p.after}`);
    out.push(`왜: ${p.whyItMayHelp}`);
  });
  out.push("말만으로 넘어가지 않을 때 이어서 해볼 것");
  report.chapter07_threeActions.forEach((a, i) => {
    out.push(`ACTION ${i + 1}. ${a.actionTitle}`);
    out.push(`  ${a.actionDetail}`);
    if (a.whyItMayHelp) out.push(`  ${a.whyItMayHelp}`);
  });

  if (report.fortuneRelationship) {
    out.push("");
    out.push("[06 출생정보와 함께 보면]");
    report.fortuneRelationship.childHints.forEach((h) => out.push(`- ${h}`));
    report.fortuneRelationship.momHints.forEach((h) => out.push(`- ${h}`));
    out.push(report.fortuneRelationship.observationContrastText);
  }

  out.push("");
  out.push("[07 기억할 한 가지]");
  out.push(report.chapter08_corePromise.oneSentenceAnchor);

  out.push("");
  out.push("[가족 공유 카드]");
  out.push(buildShareSummaryText(report));

  return out.join("\n");
}

// ── QA 유틸 ──────────────────────────────────────────────
function norm(s: string): string {
  return s.replace(/\s+/g, "").replace(/[''""‘’“”.,!?·’]/g, "");
}

/** 입력 원문의 "핵심 조각"이 고객 화면에 몇 번 등장하는지 센다. */
function countFactRepeats(copy: string, rawFact: string): number {
  const cleaned = rawFact
    .replace(/^아이가/, "")
    .replace(/함$/, "")
    .trim();
  const probe = norm(cleaned).slice(0, 12);
  if (probe.length < 6) return 0;
  const hay = norm(copy);
  let count = 0;
  let idx = hay.indexOf(probe);
  while (idx !== -1) {
    count += 1;
    idx = hay.indexOf(probe, idx + 1);
  }
  return count;
}

const GENERIC_ADVICE = [
  "아이의 의견을 존중",
  "사랑으로 감싸",
  "믿고 기다려주세요",
  "긍정적인 마음",
  "행복한 가정",
  // fallback InteractionRule 의 빈 문장들 — 유료 리포트에 나가면 안 된다.
  "최선의 방식을 찾아가는",
  "적응해 나가고 있어요",
  "한 걸음 물러서서 관찰하기",
  "따뜻한 여정",
];

/**
 * 깨진 한국어 패턴.
 * "명사+함" 을 "명사+는" 으로 잘못 줄인 형태(거부는 / 정리는 / 대답는 …)를 잡는다.
 */
const BROKEN_KOREAN_PATTERNS = [
  /거부는 모습/,
  /정리는 모습/,
  /대답는/,
  /[가-힣]하하는/,
  /[가-힣]는 모습이 있었어요\.\s*[가-힣]+는 모습이 있었어요/, // 같은 관찰형 연속 중복
  // 조사 자동 처리를 안 하고 "을(를)" 처럼 그대로 내보낸 경우
  /을\(를\)/,
  /이\(가\)/,
  /은\(는\)/,
  /과\(와\)/,
];

const EMPTY_AI_PHRASES = [
  "관계의 역동",
  "기질적 흐름",
  "기본 결",
  "편안한 소통의 바탕",
  "마음의 문",
  "부드러운 연결",
  "자연스러운 결과입니다",
];

const UNSUPPORTED_PSYCH = [
  "아이는 속으로",
  "속마음은",
  "무의식적으로",
  "사실은 사랑받고 싶어",
  "불안해서 그런",
  "일부러 그러는",
];

/** 선택된 Concern 이 아닌 다른 Concern 전용 어휘가 섞였는지 */
const CONCERN_LEAK_WORDS: Record<string, string[]> = {
  discipline: ["잠자리", "숟가락", "반찬", "취침", "불 끄"],
  sleep: ["숟가락", "반찬", "식판", "한 입"],
  meal: ["잠자리", "취침", "불 끄", "눕자"],
};

describe("P2.5 PAID REPORT CONTENT DENSITY", () => {
  const generated = CASES.map((c) => {
    const report = generateSignatureReport(
      c.childProfile,
      c.childEvidences,
      buildMomEvidence(c.momAnswers),
      c.conflictInput,
      null,
      c.caregiverProfile
    );
    return { ...c, report, copy: renderCustomerCopy(report) };
  });

  it("고객 문구 전문 출력 (사람이 읽고 판단)", () => {
    // §16: 자동 테스트 PASS 만으로 끝내지 않는다. 실제 고객 문구 전문을 파일로 남겨
    // 사람이 직접 읽고 판단할 수 있게 한다.
    const dump = generated
      .map((g) => {
        // §14 HUMAN VALUE QA — 실제 측정치
        const r = g.report;
        // 고객 입력을 그대로 되돌려주는 부분(FACT): 장면 전문 + BEFORE 인용
        const factChars =
          r.chapter01_recurringScene.narrative.length +
          r.chapter06_threePhrases.reduce((n, p) => n + p.before.length, 0);
        const totalChars = g.copy.replace(/\[[^\]]+\]/g, "").replace(/\s/g, "").length;
        const restatePct = Math.round((factChars / totalChars) * 100);

        const newInsights = [
          r.insightMechanism?.focusShift,
          r.insightMechanism?.escalationPoint,
          r.insightMechanism?.smallestLever,
          r.breakPointWhy,
        ].filter(Boolean).length;

        const actionCount =
          r.chapter06_threePhrases.length + r.chapter07_threeActions.length + 1;

        const dupCounts = [
          countFactRepeats(g.copy, g.conflictInput.childFirstReaction!),
          countFactRepeats(g.copy, g.conflictInput.momTypicalPhrase!),
          countFactRepeats(g.copy, g.conflictInput.subsequentEscalation!),
        ];

        const metrics = [
          `--- QA (${g.label}) ---`,
          `입력 재진술 비중: 약 ${restatePct}%  (${
            restatePct <= 40 ? "적절" : "높음"
          })`,
          `새로운 Insight: ${newInsights}개`,
          `실제 행동 제안: ${actionCount}개`,
          `Semantic Duplicate(동일 사실 3회 이상): ${
            dupCounts.filter((n) => n >= 3).length
          }건  [아이행동 ${dupCounts[0]}회 / 보호자발화 ${dupCounts[1]}회 / 결과 ${dupCounts[2]}회]`,
          `Fallback Rule 사용: ${
            r.twoPersonSummary?.childSummary.includes("이 장면에서") ? "예(장면 기반 대체 문구 적용)" : "아니오"
          }`,
        ].join("\n");

        return `${"=".repeat(70)}\n${g.label}\n${"=".repeat(70)}\n${g.copy}\n\n${metrics}\n`;
      })
      .join("\n");
    const target = process.env.P25_DUMP_PATH;
    if (target) writeFileSync(target, dump, "utf8");
    expect(generated.length).toBe(3);
  });

  it("§5 동일 사실 원문 반복 2회 이하", () => {
    generated.forEach((g) => {
      const facts = {
        childBehavior: g.conflictInput.childFirstReaction!,
        caregiverReaction: g.conflictInput.momTypicalPhrase!,
        conflictResult: g.conflictInput.subsequentEscalation!,
      };
      Object.entries(facts).forEach(([name, raw]) => {
        const n = countFactRepeats(g.copy, raw);
        console.log(`[${g.label}] ${name} 반복 = ${n}회`);
        expect(n, `${g.label} / ${name} 이 ${n}회 반복`).toBeLessThanOrEqual(2);
      });
    });
  });

  it("§7 Chain 제목의 단계 수가 실제 단계 수와 일치", () => {
    generated.forEach((g) => {
      const steps = g.report.chapter04_conflictChain.steps.length;
      expect(g.report.chapter04_conflictChain.title).toContain(`${steps}단계`);
      expect(g.copy).not.toContain("5단계 패턴");
    });
  });

  it("§7 끊는 지점이 보호자가 통제 가능한 칸(보호자 첫 반응)을 가리킨다", () => {
    generated.forEach((g) => {
      const target = g.report.chapter04_conflictChain.whereToBreak.targetStep;
      const step = g.report.chapter04_conflictChain.steps.find(
        (s) => s.stepNumber === target
      );
      expect(step?.stage).toBe("mom_reaction");
      // breakPointWhy 서술의 "3번"과 실제 targetStep 이 어긋나면 안 된다.
      if (g.report.breakPointWhy?.includes("3번")) {
        expect(target).toBe(3);
      }
    });
  });

  it("§8 같은 CTA 제목이 한 Section 안에서 2번 반복되지 않는다", () => {
    generated.forEach((g) => {
      const occurrences = (g.copy.match(/끊어볼 수 있어요/g) || []).length;
      expect(occurrences, `${g.label} 에서 ${occurrences}회`).toBeLessThanOrEqual(1);
    });
  });

  it("§9 §10 의미 없는 AI 문장 / 범용 육아명언 / 근거 없는 심리 서술 0건", () => {
    generated.forEach((g) => {
      [...GENERIC_ADVICE, ...EMPTY_AI_PHRASES, ...UNSUPPORTED_PSYCH].forEach((bad) => {
        expect(g.copy, `${g.label} 에 "${bad}"`).not.toContain(bad);
      });
    });
  });

  it("Broken Korean 0건", () => {
    generated.forEach((g) => {
      BROKEN_KOREAN_PATTERNS.forEach((re) => {
        expect(re.test(g.copy), `${g.label} 에서 깨진 한국어 ${re}`).toBe(false);
      });
    });
  });

  it("Cross Concern Leakage 0건", () => {
    generated.forEach((g) => {
      const leaks = CONCERN_LEAK_WORDS[g.conflictInput.concernId] ?? [];
      leaks.forEach((w) => {
        expect(g.copy, `${g.label} 에 다른 고민 어휘 "${w}"`).not.toContain(w);
      });
    });
  });

  it("§6 '실제 행동이 더 중요' 안내는 리포트당 1회만", () => {
    generated.forEach((g) => {
      const n = (g.copy.match(/관찰된 행동/g) || []).length;
      expect(n, `${g.label} 에서 ${n}회`).toBeLessThanOrEqual(1);
    });
  });

  it("§11 고객이 입력하지 않은 새 정보(MECHANISM)가 3개 이상", () => {
    generated.forEach((g) => {
      const m = g.report.insightMechanism;
      expect(m).toBeDefined();
      const items = [m!.focusShift, m!.escalationPoint, m!.smallestLever];
      items.forEach((t) => expect(t.length).toBeGreaterThan(40));
      expect(items.length).toBeGreaterThanOrEqual(3);
      expect(g.report.breakPointWhy!.length).toBeGreaterThan(40);
    });
  });

  it("P2.2V.6 관계명 누수 없음 (아빠/외할머니 리포트에 '엄마' 금지)", () => {
    generated.forEach((g) => {
      if (g.caregiverProfile.roleLabel !== "엄마") {
        expect(g.copy, `${g.label} 에 '엄마' 누수`).not.toContain("엄마");
      }
    });
  });

  it("§12 가족 공유 카드는 본문을 복붙하지 않는다", () => {
    generated.forEach((g) => {
      const share = buildShareSummaryText(g.report);
      expect(share).not.toContain(g.report.chapter01_recurringScene.narrative);
      expect(share).not.toContain(
        g.report.chapter04_conflictChain.whereToBreak.breakActionDetail
      );
    });
  });
});
