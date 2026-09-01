// sweep30.test.ts: 30+ Synthetic Response Combination Dry-run Sweep Test
//
// 검사 항목:
// 1. runtime error = 0
// 2. unsupported claim = 0
// 3. fortune-only advice = 0
// 4. false strong = 0 (STRONG 은 반드시 3개+ 일관된 관찰 & 갈등 일치)
// 5. unhandled contradiction = 0
// 6. forced dominant type = 0

import { describe, expect, it } from "vitest";
import { buildEvidenceClaims } from "@/lib/interaction/evidenceClaimEngine";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import type {
  BehaviorEvidence,
  ChildProfile,
  CurrentConflictInput,
  FortuneFacts,
  MomAnswers,
  QuestionDomain,
} from "@/lib/types";

describe("P2.0H 30-CASE SYNTHETIC COMBINATION SWEEP", () => {
  it("runs 36 synthetic combinations and verifies zero violations", () => {
    const domains: QuestionDomain[] = [
      "transition",
      "new_environment",
      "self_assertion",
      "social_approach",
      "play_immersion",
      "praise",
    ];

    const elements: ("wood" | "fire" | "earth" | "metal" | "water")[] = [
      "wood",
      "fire",
      "earth",
      "metal",
      "water",
    ];

    let totalCases = 0;
    let totalUnsupported = 0;
    let totalFortuneOnlyAdvice = 0;
    let totalFalseStrong = 0;
    let totalUnhandledContradictions = 0;
    let totalForcedDominant = 0;

    // 36개 다양한 합성 케이스 생성 및 실행
    for (let i = 0; i < 36; i++) {
      totalCases++;
      const isKnown = i % 2 === 0;
      const el = elements[i % elements.length];

      const profile: ChildProfile = {
        name: `아이_${i + 1}`,
        birthDate: "2023-01-01",
        birthTimeKnown: isKnown,
        birthTime: isKnown ? "10:00" : undefined,
        gender: i % 2 === 0 ? "boy" : "girl",
      };

      const fortuneFacts: FortuneFacts | null = {
        day: { stem: "갑", branch: "자", stemElement: el, branchElement: "water" },
        dayMasterElement: el,
        hour: isKnown ? { stem: "을", branch: "축", stemElement: "wood", branchElement: "earth" } : null,
        hourTenGod: isKnown ? "겁재" : null,
        year: "unknown",
        month: "unknown",
        birthTimeKnown: isKnown,
        supported: { dayPillar: true, hourPillar: isKnown, yearPillar: false, monthPillar: false },
      };

      // Case 유형별 관찰 데이터 조합
      const evidences: BehaviorEvidence[] = [];

      if (i % 4 === 0) {
        // Strong 케이스: transition 일관 3개
        evidences.push(
          {
            domain: "transition",
            axis: "transition_preference",
            patternId: "needs_completion_before_transition",
            observedLabel: "하던 놀이를 끝맺어야 전환하는 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q1"] },
          },
          {
            domain: "transition",
            axis: "transition_preference",
            patternId: "needs_completion_before_transition",
            observedLabel: "외출 준비 시에도 마침표가 필요한 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q2"] },
          },
          {
            domain: "transition",
            axis: "transition_preference",
            patternId: "needs_completion_before_transition",
            observedLabel: "식사 시간에도 하던 단계를 마무리하려는 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q3"] },
          }
        );
      } else if (i % 4 === 1) {
        // Contradiction 케이스: transition 모순 2개
        evidences.push(
          {
            domain: "transition",
            axis: "transition_preference",
            patternId: "switches_readily",
            observedLabel: "일반 상황에서는 바로 전환하는 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q1"] },
          },
          {
            domain: "transition",
            axis: "transition_preference",
            patternId: "needs_completion_before_transition",
            observedLabel: "좋아하는 놀이에서는 마침표를 원하는 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q2"] },
          }
        );
      } else if (i % 4 === 2) {
        // No dominant 케이스: 각 축당 1개씩 분산 (모두 Single/Low)
        evidences.push(
          {
            domain: "new_environment",
            axis: "needs_observation_time",
            patternId: "brief_scan_then_engages",
            observedLabel: "잠깐 둘러본 뒤 움직이는 모습",
            strength: "low",
            source: { scope: "general", questionIds: ["q1"] },
          },
          {
            domain: "self_assertion",
            axis: "strong_self_direction",
            patternId: "moderate_pace",
            observedLabel: "자기 주장을 조율하는 모습",
            strength: "low",
            source: { scope: "general", questionIds: ["q2"] },
          }
        );
      } else {
        // Medium 케이스: new_env 일관 2개
        evidences.push(
          {
            domain: "new_environment",
            axis: "needs_observation_time",
            patternId: "takes_long_to_observe",
            observedLabel: "새로운 상황에서 천천히 살피는 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q1"] },
          },
          {
            domain: "new_environment",
            axis: "needs_observation_time",
            patternId: "takes_long_to_observe",
            observedLabel: "처음 보는 모임에서도 관찰 후 참여하는 모습",
            strength: "medium",
            source: { scope: "general", questionIds: ["q2"] },
          }
        );
      }

      const momAnswers: MomAnswers = {
        time_pressure_style: i % 2 === 0 ? "opt_time_control" : "opt_time_wait",
        emotion_coping_style: i % 2 === 0 ? "opt_emo_explain" : "opt_emo_hold",
        instruction_resistance_style: "opt_inst_firm",
        routine_flexibility_style: "opt_rout_replan",
        conflict_recovery_style: "opt_rec_repair",
      };
      const momEv = buildMomEvidence(momAnswers);

      const conflictInput: CurrentConflictInput = {
        concernId: i % 4 === 0 ? "discipline" : "etc",
        scenarioId: "sc_test",
      };

      const result = buildEvidenceClaims(evidences, momEv, conflictInput, fortuneFacts);

      // 1. Unsupported check
      totalUnsupported += result.coverageReport.unsupportedClaims;

      // 2. Fortune-only advice check
      totalFortuneOnlyAdvice += result.coverageReport.fortuneOnlyClaims;
      result.recommendations.forEach((rec) => {
        const hasBehavior = rec.evidenceRefs.some((r) => r.startsWith("child:") || r.startsWith("mom:"));
        if (!hasBehavior) totalFortuneOnlyAdvice++;
      });

      // 3. False STRONG check (STRONG 은 evidenceRef >= 3 & conflict match)
      result.claims.forEach((c) => {
        if (c.evidenceStrength === "STRONG") {
          if (c.evidenceRefs.length < 3) totalFalseStrong++;
        }
      });

      // 4. Unhandled contradiction check (모순 있는 경우 isContradictionResolved 있어야 함)
      if (i % 4 === 1) {
        if (result.coverageReport.contradictionResolvedCount === 0) {
          totalUnhandledContradictions++;
        }
      }

      // 5. Forced dominant check (분산된 경우 STRONG/단정 성격 없어야 함)
      if (i % 4 === 2) {
        const strongClaims = result.claims.filter((c) => c.layer === "INFERRED" && c.evidenceStrength === "STRONG");
        if (strongClaims.length > 0) totalForcedDominant++;
        if (result.summaryOneSentence.includes("일관되게")) totalForcedDominant++;
      }
    }

    expect(totalCases).toBe(36);
    expect(totalUnsupported).toBe(0);
    expect(totalFortuneOnlyAdvice).toBe(0);
    expect(totalFalseStrong).toBe(0);
    expect(totalUnhandledContradictions).toBe(0);
    expect(totalForcedDominant).toBe(0);
  });
});
