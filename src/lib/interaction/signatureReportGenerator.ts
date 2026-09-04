// signatureReportGenerator 모듈: InteractionRule + Evidence -> SignatureReport 생성
//
// 원칙 (P2.2H & P2.2V.2):
// 1. Sentence-level claim provenance: 모든 문장에 claimId, claimType, evidenceRefs, inferenceLevel 연결.
// 2. CurrentConflict is Scene Source of Truth: 사용자가 입력하지 않은 세부 행동/대사 창작 금지.
// 3. Mom Domain Match: Mom Evidence 와 Conflict domain 이 일치할 때만 사용. 불일치 시 conflict direct response 우선.
// 4. No Unsupported Inner State (Child / Mom): 확정적 내면 단정 배제 (~처럼 받아들여질 수 있어요).
// 5. Low-Friction Family (Family E) Dynamic Chapter 05: "지금 우리 둘이 잘 맞는 지점".
// 6. Remove Long-Term Promise & Therapeutic Metaphors (평생의 정서적 지지대, 진정제 등 금지).
// 7. Non-deterministic effect phrasing: ~방식을 시도해볼 수 있어요, ~하는 데 도움이 될 수 있어요.
// 8. Concern is Report Anchor: 식습관(meal), 수면, 떼쓰기 등 선택된 고민에 부합하는 장면과 상호작용 생성.
// 9. Real Caregiver Fortune Facts & ParentChildFortuneReflection: 사주 궁합 점수(점수, 찰떡궁합 등) 금지, 나×아이 출생정보 교차 보조 힌트 제공 + 관찰 우선 원칙 명시.
// 10. P2.2V.6 Caregiver Generalization: 고객 문구의 관계명은 항상 caregiverRoleLabel 기준.
//     "엄마" 고정 문구 금지, 관계명만으로 심리/행동 추론 금지(부모 전제 문구 포함).
// 11. P2.4 PAID REPORT RECOMMENDATION ALIGNMENT: CH06(말)/CH07(행동)/CH08(약속)은
//     CurrentConflict.scenarioId 기반 scenarioRecommendations 를 1차 근거로 쓰고,
//     Primary Interaction Rule 의 정적 예시는 scenarioId 매칭이 없을 때만 fallback.

import type {
  BehaviorEvidence,
  CaregiverProfile,
  CaregiverRole,
  ChildProfile,
  CurrentConflictInput,
  Element,
  FortuneFacts,
  MomEvidence,
  ParentChildFortuneReflection,
  SentenceClaim,
  SignatureReport,
} from "@/lib/types";
import { computeAge } from "@/lib/age";
import { computeFortuneFacts } from "@/lib/fortune/engine";
import {
  applyCaregiverLabel,
  conj,
  resolveDisplayName,
  resolveRoleLabel,
  subj,
  topic,
} from "@/lib/caregiver";
import { matchInteractionRule } from "./interactionEngine";
import {
  formatCaregiverObservedReaction,
  formatChildObserved,
  formatEscalationFact,
  mergeCaregiverReactionSentence,
} from "./copyFormatters";
import { CONFLICT_SCENARIOS } from "./conflictScenarios";
import { SCENARIO_RECOMMENDATIONS } from "./scenarioRecommendations";
import { buildReportInsights } from "./reportInsights";

/** 관계 정보가 없는 레거시 호출도 허용하되, 고객 문구는 관계명 기준으로 만든다. */
type CaregiverInput =
  | CaregiverProfile
  | {
      role?: CaregiverRole;
      roleLabel?: string;
      displayName?: string;
      name?: string;
      birthDate?: string;
      birthTimeKnown?: boolean;
      birthTime?: string;
    }
  | null;

// P2.2V.4 FIX (Section 7): DayMaster Element 하나만으로 만들어지는 REFLECTIVE_EDITORIAL 문구.
// 심리적 사실처럼 단정하지 않도록 "~한 방향의 힌트로 참고해볼 수 있어요" 수준으로 고정한다.
const ELEMENT_HINT_CHILD: Record<Element, string> = {
  wood: "새로운 시도를 먼저 해보려는 방향의 힌트로 참고해볼 수 있어요.",
  fire: "감정과 에너지를 바로 표현하는 방향의 힌트로 참고해볼 수 있어요.",
  earth: "자리를 잡고 천천히 익숙해지는 방향의 힌트로 참고해볼 수 있어요.",
  metal: "기준을 분명히 세우고 마무리하려는 방향의 힌트로 참고해볼 수 있어요.",
  water: "상황을 바로 밀어붙이기보다 한 번 살펴보는 방향의 힌트로 참고해볼 수 있어요.",
};

const ELEMENT_HINT_MOM: Record<Element, string> = {
  wood: "상황의 방향을 먼저 정하려는 쪽의 힌트로 참고해볼 수 있어요.",
  fire: "생각을 먼저 말로 꺼내며 빠르게 소통하는 방향의 힌트로 참고해볼 수 있어요.",
  earth: "상황을 받아들이며 중심을 잡으려는 방향의 힌트로 참고해볼 수 있어요.",
  metal: "규칙과 순서를 먼저 정리하려는 방향의 힌트로 참고해볼 수 있어요.",
  water: "상황을 살핀 뒤 다음 단계를 천천히 정하려는 방향의 힌트로 참고해볼 수 있어요.",
};

const ELEMENT_KEYWORD: Record<Element, string> = {
  wood: "주도적 탐색",
  fire: "적극적 표현",
  earth: "안정적 포용",
  metal: "명확한 정리",
  water: "유연한 관찰",
};

export function generateSignatureReport(
  profile: ChildProfile,
  childEvidences: BehaviorEvidence[],
  momEvidences: MomEvidence[],
  conflictInput: CurrentConflictInput,
  fortuneFacts?: FortuneFacts | null,
  caregiverProfile?: CaregiverInput
): SignatureReport {
  const ageInfo = computeAge(profile.birthDate);
  const ageDisplay = ageInfo?.ageDisplay || "만 3세";
  const childName = profile.name || "우리 아이";
  const cSubj = subj(childName);
  const cTopic = topic(childName);
  // P2.2V.6: 관계명이 기준. 애칭을 입력했으면 서술 문장에서 애칭을 쓴다.
  const caregiverRoleLabel = resolveRoleLabel(caregiverProfile);
  const caregiverRole: CaregiverRole = caregiverProfile?.role ?? "guardian";
  const momName = resolveDisplayName(caregiverProfile);

  const match = matchInteractionRule(
    childEvidences,
    momEvidences,
    conflictInput.concernId
  );
  // 규칙 문장의 {{CG}} 토큰을 실제 관계명으로 치환한다(단일 렌더러).
  const rule = applyCaregiverLabel(match.rule, caregiverRoleLabel);
  const refs = match.evidenceRefs;

  const concernLabels: Record<string, string> = {
    tantrum: "떼쓰기/울음",
    stubborn: "고집/자기주장",
    discipline: "훈육/규칙 거부",
    meal: "식습관/편식",
    sleep: "수면/잠자리",
    daycare: "등원/분리불안",
    shyness: "낯가림/수줍음",
    friends: "친구 관계/사회성",
    sibling: "형제/자매 갈등",
    only_with_mom: "나에게만 심함",
    focus_play: "놀이 몰입/산만",
    learning: "학습/집중",
    etc: "일상의 작은 마찰",
  };
  const concernLabel = concernLabels[conflictInput.concernId] || "일상의 부딪힘";
  // P2.4 긴급 수정: rule.interactionType(collaborative 여부)으로 CH04/CH05 장면 내용을
  // 바꿔치기하지 않는다. 실제 Current Conflict가 Primary Source of Truth이며,
  // 근거 없는 "Low-Friction" 서술을 만들지 않는다(PAID REPORT CONTENT INTEGRITY GATE §4).

  const allSentenceClaims: SentenceClaim[] = [];

  // ── Child & Mom Fortune Facts Computation ──────────────────
  let childFortune = fortuneFacts;
  if (!childFortune && profile.birthDate) {
    childFortune = computeFortuneFacts(
      profile.birthDate,
      profile.birthTimeKnown ?? false,
      profile.birthTime
    );
  }

  let momFortune: FortuneFacts | null = null;
  if (caregiverProfile?.birthDate) {
    momFortune = computeFortuneFacts(
      caregiverProfile.birthDate,
      caregiverProfile.birthTimeKnown ?? false,
      caregiverProfile.birthTime
    );
  }

  // ── Parent × Child Fortune Relationship Layer ──────────────
  let fortuneRelationship: ParentChildFortuneReflection | undefined = undefined;
  if (childFortune && momFortune) {
    const cEl = childFortune.dayMasterElement;
    const mEl = momFortune.dayMasterElement;

    const childHints: string[] = [
      `${childName}의 출생정보에서는 ${ELEMENT_HINT_CHILD[cEl]}`,
    ];
    if (childFortune.hourTenGod) {
      childHints.push(
        `${childName}의 시간(時) 힌트에서는 스스로 느끼고 표현하는 활동에 집중하려는 방향의 힌트로 참고해볼 수 있어요.`
      );
    }

    const momHints: string[] = [
      `${momName}의 출생정보에서는 ${ELEMENT_HINT_MOM[mEl]}`,
    ];
    if (momFortune.hourTenGod) {
      momHints.push(
        `${momName}의 시간(時) 힌트에서는 일상 흐름을 안정적으로 다듬어가려는 방향의 힌트로 참고해볼 수 있어요.`
      );
    }

    const sharedThemes = [
      `두 사람에게서 비슷하게 보이는 방향: ${childName}와 ${momName} 모두 일상 속에서 상황에 맞춰 반응하려는 태도`,
    ];
    const contrastingThemes = [
      `서로 다른 방식으로 나타나는 지점: 상황을 마주했을 때 ${childName}의 [${ELEMENT_KEYWORD[cEl]}] 방식과 ${momName}의 [${ELEMENT_KEYWORD[mEl]}] 방식의 차이`,
    ];

    const reflectionText = `두 사람의 출생정보에서는 서로 다른 방향의 힌트를 참고해볼 수 있어요. ${cTopic} ${ELEMENT_HINT_CHILD[cEl]} 반면 ${topic(momName)} ${ELEMENT_HINT_MOM[mEl]} 다만 이번 관계 리포트에서는 ${conj(childName)} ${subj(momName)} 실제로 보여준 행동과 반응을 더 중요한 기준으로 봤어요.`;

    // P2.5 §6: "실제 행동이 더 중요합니다"를 리포트 안에서 여러 번 반복하면
    // 사주 파트가 스스로를 무가치하게 만든다. 이 안내는 여기 한 번만 하고,
    // 무시하라는 말이 아니라 "어떤 순서로 썼는지"를 밝히는 포지셔닝으로 서술한다.
    const observationContrastText = `이 리포트의 결론은 출생정보가 아니라 위에서 본 ${concernLabel} 장면에서 나왔어요. 출생정보는 그 결론을 다른 각도에서 한 번 더 비춰보는 보조 렌즈로만 참고했어요. 두 가지가 서로 달라 보일 때는 언제나 실제로 관찰된 행동 쪽을 따릅니다.`;

    fortuneRelationship = {
      childHints,
      momHints,
      sharedThemes,
      contrastingThemes,
      reflectionText,
      observationContrastText,
      evidenceType: "REFLECTIVE",
    };
  }

  // Two-Person Summary Keywords & Synthesis
  const childPatterns = childEvidences.map((e) => e.patternId);
  const childKeywords: string[] = [];
  if (conflictInput.concernId === "meal") {
    if (childPatterns.some((p) => p.includes("observe") || p.includes("reassurance"))) {
      childKeywords.push("새로운음식에신중해요", "눈으로먼저살펴요");
    } else if (childPatterns.some((p) => p.includes("completion") || p.includes("own_way"))) {
      childKeywords.push("나만의식사속도가있어요", "스스로선택하고싶어요");
    } else {
      childKeywords.push("식사속도를지켜요", "내방식대로먹어요");
    }
  } else if (conflictInput.concernId === "sleep") {
    if (
      childPatterns.some((p) =>
        ["sleep_transition_needs_completion", "sleep_transition_delays_bedtime", "sleep_prebed_continues_activity"].includes(p)
      )
    ) {
      childKeywords.push("잠자리전마무리필요", "전환속도를지켜요");
    } else if (
      childPatterns.some((p) =>
        ["sleep_routine_prefers_familiar_sequence", "sleep_routine_resists_change"].includes(p)
      )
    ) {
      childKeywords.push("익숙한순서선호", "잠자리흐름을지켜요");
    } else {
      childKeywords.push("잠자리전환신중", "나만의속도가있어요");
    }
  } else {
    if (childPatterns.some((p) => p.includes("completion") || p.includes("deep_single_focus"))) {
      childKeywords.push("마무리하고넘어가요", "하던일에몰입해요");
    } else if (childPatterns.some((p) => p.includes("observe") || p.includes("reassurance"))) {
      childKeywords.push("주변을먼저살펴요", "마음의준비가필요해요");
    } else if (childPatterns.some((p) => p.includes("burst") || p.includes("praise"))) {
      childKeywords.push("감정이먼저올라와요", "칭찬받으면신나요");
    } else if (childPatterns.some((p) => p.includes("independent") || p.includes("reason"))) {
      childKeywords.push("내가직접해보고싶어요", "이유를알고싶어요");
    } else {
      childKeywords.push("나만의페이스가있어요", "스스로느끼고움직여요");
    }
  }

  const momPatterns = momEvidences.map((e) => e.patternId);
  const momKeywords: string[] = [];
  if (conflictInput.concernId === "meal") {
    if (momPatterns.some((p) => p.includes("fast_pace") || p.includes("firm_boundary"))) {
      momKeywords.push("골고루챙겨먹여요", "식사시간을지키려해요");
    } else if (momPatterns.some((p) => p.includes("explanation") || p.includes("logical"))) {
      momKeywords.push("영양과이유를설명해요", "한입이라도먹길바라요");
    } else {
      momKeywords.push("건강하게먹이고싶어요", "아이식사를챙기려해요");
    }
  } else if (conflictInput.concernId === "sleep") {
    if (momPatterns.some((p) => p.includes("fast_pace") || p.includes("time_notice") || p.includes("firm_boundary"))) {
      momKeywords.push("취침시간을지키려해요", "잠자리로재촉해요");
    } else if (momPatterns.some((p) => p.includes("rapid_rescheduling") || p.includes("preference_for_structure"))) {
      momKeywords.push("순서를바꾸려해요", "흐름을정리하려해요");
    } else {
      momKeywords.push("잠자리를챙기려해요", "편하게재우고싶어요");
    }
  } else {
    if (momPatterns.some((p) => p.includes("fast_pace") || p.includes("time_notice"))) {
      momKeywords.push("시간이급하면속도가빨라져요", "해야할일은분명히알려줘요");
    } else if (momPatterns.some((p) => p.includes("stress_activation") || p.includes("overwhelm"))) {
      momKeywords.push("아이가머뭇거리면마음이쓰여요", "어서어울리게돕고싶어요");
    } else if (momPatterns.some((p) => p.includes("explanation") || p.includes("logical"))) {
      momKeywords.push("차근차근이유를설명해요", "상황을납득시켜주고싶어요");
    } else if (momPatterns.some((p) => p.includes("firm_boundary") || p.includes("directive"))) {
      momKeywords.push("규칙과기준을지키려해요", "할일은미루지않고해야해요");
    } else if (momPatterns.some((p) => p.includes("patient_pace") || p.includes("silent_emotional"))) {
      momKeywords.push("묵묵히곁에서기다려줘요", "아이속도에맞춰주려해요");
    } else {
      momKeywords.push("상황에맞춰조율해요", "아이의마음을살피려해요");
    }
  }

  const childReact = conflictInput.childFirstReaction || `${cSubj} 하던 방식을 이어가려 함`;
  const momReact =
    conflictInput.momFirstReaction ||
    `${subj(caregiverRoleLabel)} 상황을 정리하려 안내함`;
  const typicalPhrase = conflictInput.momTypicalPhrase;
  const escalation = conflictInput.subsequentEscalation || "서로의 대화가 길어짐";

  // ── P2.5 CONTENT DENSITY: 구조 분석(MECHANISM) 레이어 ──────
  // 고객 입력 재진술이 아니라, 입력들을 연결해야 보이는 구조를 만든다.
  // SECTION 1(엇갈리는 지점) / SECTION 3(왜 길어지나) / SECTION 4(왜 이 지점인가) 의 근거.
  const insights = buildReportInsights({
    childName,
    caregiverRoleLabel,
    caregiverDisplayName: momName,
    concernId: conflictInput.concernId,
    childFirstReaction: childReact,
    momFirstReaction: momReact,
    momTypicalPhrase: typicalPhrase,
    subsequentEscalation: escalation,
    recentFrequency: conflictInput.recentFrequency,
  });

  let misalignedPoint = "";
  if (rule.ruleId === "rule_friction_meal_new_food_hesitation") {
    misalignedPoint = `${momName}는 ‘골고루 먹는 건강한 식사’를 챙기고 싶고, ${cTopic} ‘낯선 음식을 스스로 눈으로 확인할 편안한 틈’이 필요해요.`;
  } else if (rule.ruleId === "rule_friction_meal_autonomy_pacing") {
    misalignedPoint = `${momName}는 ‘정해진 식사 시간과 양’을 지키려 하고, ${cTopic} ‘자신이 원하는 속도와 선택권’을 지키고 싶어 해요.`;
  } else if (rule.ruleId === "rule_friction_sleep_transition_vs_pace") {
    // P2.5: 장면 원문을 SECTION 1에서 다시 인용하지 않는다(장면 전문은 SECTION 2에 한 번만).
    // 다른 분기들과 동일하게 "서로가 지키려는 것"의 대비로만 서술한다.
    misalignedPoint = `${momName}는 ‘정해진 취침 시간’에 맞추려 하고, ${cTopic} ‘하던 활동의 마무리’까지 이어가는 모습을 보여요.`;
  } else if (rule.ruleId === "rule_friction_sleep_routine_vs_change") {
    misalignedPoint = `${momName}는 ‘상황에 맞게 순서를 바꾸려’ 하고, ${cTopic} ‘익숙한 잠자리 순서’를 지키고 싶어 해요.`;
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    misalignedPoint = `${momName}는 ‘이제 가야 할 시간’을 보고, ${cTopic} ‘아직 끝나지 않은 놀이’를 보고 있어요.`;
  } else if (rule.ruleId === "rule_friction_observation_vs_stress") {
    misalignedPoint = `${momName}는 ‘어서 편하게 어울리는 모습’을 바라고, ${cTopic} ‘주변이 익숙해질 관찰 시간’이 필요해요.`;
  } else if (rule.ruleId === "rule_friction_emotion_vs_explanation") {
    misalignedPoint = `${momName}는 ‘상황을 납득할 논리적 이유’를 먼저 전하고, ${cTopic} ‘속상한 감정의 환기’가 먼저 필요해요.`;
  } else if (rule.ruleId === "rule_friction_autonomy_vs_firmness") {
    misalignedPoint = `${momName}는 ‘지켜야 할 분명한 규칙’을 안내하고, ${cTopic} ‘스스로 고르고 주도할 작은 선택지’를 원해요.`;
  } else if (rule.ruleId === "rule_collab_observation_and_patience") {
    misalignedPoint = `${childName}의 신중한 관찰 속도를 ${momName}가 묵묵히 지켜봐 주며 서로 편안한 호흡을 맞추고 있어요.`;
  } else {
    // P2.4 긴급 수정 (§7 CUSTOMER COPY QUALITY): Concern label을 문장에 그대로 붙이지 않는다.
    // P2.5 CONTENT DENSITY: 여기서 장면 원문(보호자 발화 + 아이 행동)을 그대로 재인용하면
    // SECTION 2(장면 전문)와 완전히 같은 문장이 되어 중복 3회 이상이 된다.
    // 대신 "두 사람이 움직이는 방향의 대비"로만 서술한다(crossingPoint).
    misalignedPoint = insights.crossingPoint;
  }

  let fortuneRelationshipHint: string | undefined = undefined;
  if (childFortune && momFortune) {
    const cEl = childFortune.dayMasterElement;
    const mEl = momFortune.dayMasterElement;
    fortuneRelationshipHint = `아이: ${ELEMENT_KEYWORD[cEl]} 성향 / ${caregiverRoleLabel}: ${ELEMENT_KEYWORD[mEl]} 성향 · 서로 다른 속도와 표현 방식을 참고해볼 수 있어요.`;
  }

  // P2.5 §9 §10: 매칭 규칙이 없어 fallback 으로 떨어지면 규칙의 원래 문구가
  // "상황에 맞는 최선의 방식을 찾아가는 과정이에요" 같은 빈 문장이라 유료 리포트의
  // SECTION 01 이 통째로 무의미해진다. 이 경우 실제 분류된 행동 문장으로 대체한다.
  const twoPersonSummary = {
    childKeywords,
    childSummary: match.isFallback
      ? insights.fallbackCopy.childSummary
      : rule.childPerspectiveSummary,
    momKeywords,
    momSummary: match.isFallback
      ? insights.fallbackCopy.caregiverSummary
      : rule.momPerspectiveSummary,
    misalignedPoint,
    fortuneRelationshipHint,
  };

  // ── Chapter 01: 지금 우리 집에서 반복되는 장면 (CurrentConflict literal direct ground) ──
  // P2.4 긴급 수정 (PAID REPORT CONTENT INTEGRITY GATE §1): Concern별 장면 오프너/키워드를
  // CH01·CH04가 공유하는 단일 소스로 고정한다(Primary Interaction Lock). 이전에는 CH01만
  // conflictInput 기반이고 CH04는 별도의 하드코딩 템플릿(isCollaborative/ruleId 분기)을 써서
  // 같은 리포트 안에서 서로 다른 장면(Concern)이 섞여 나오는 문제가 있었다.
  const CONCERN_SCENE_OPENERS: Partial<Record<string, string>> = {
    meal: "식사 시간이나 식탁 앞에서 음식을 마주하는 순간",
    sleep: "잠자리에 들어가거나 수면 시간을 앞둔 순간",
    tantrum: "뜻대로 되지 않아 감정이 일어나는 순간",
    shyness: "새로운 장소나 낯선 환경을 마주하는 순간",
    daycare: "새로운 장소나 낯선 환경을 마주하는 순간",
    discipline: "일상의 규칙이나 할 일을 챙겨야 하는 순간",
  };
  const CONCERN_SCENE_KEYWORDS: Partial<Record<string, string[]>> = {
    meal: ["식사 시간", "식습관/편식", "식탁에서의 실랑이"],
    sleep: ["잠자리", "수면/잠자리", "재촉과 미루기"],
    tantrum: ["감정 표현", "떼쓰기/울음", "대화의 타이밍"],
    shyness: ["새로운 환경", "낯가림/수줍음", "참여 권유"],
    daycare: ["새로운 환경", "낯가림/수줍음", "참여 권유"],
    discipline: ["일상 규칙", "훈육/규칙", "실랑이"],
  };
  const sceneOpener =
    CONCERN_SCENE_OPENERS[conflictInput.concernId] ?? `${concernLabel} 상황에서 반복되는 순간`;

  // (escalation 은 위 MECHANISM 레이어에서 이미 정의됨)
  // Concern Hard Lock: 다른 Concern 전용 문구(잠자리/숟가락 등)가 섞이지 않도록
  // 실제 선택된 concernId 를 명시적으로 전달한다.
  const caregiverSceneReaction = mergeCaregiverReactionSentence(
    caregiverRoleLabel,
    momReact,
    typicalPhrase,
    conflictInput.concernId
  );
  const childSceneObserved = formatChildObserved(childName, childReact);
  const escalationFact = formatEscalationFact(escalation, childName);

  const sceneNarrative = `${sceneOpener}. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
  const sceneKeywords =
    CONCERN_SCENE_KEYWORDS[conflictInput.concernId] ?? [concernLabel, "속도 차이", "반응 방식"];

  const ch1Claims: SentenceClaim[] = [
    {
      claimId: "ch1_c1",
      claimType: "DIRECT_INPUT",
      chapter: 1,
      text: sceneNarrative,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
  ];
  allSentenceClaims.push(...ch1Claims);

  // ── Chapter 02: 같은 순간, 서로 달랐던 행동 (입력 근거만) ──
  const momObservedReaction = formatCaregiverObservedReaction(
    caregiverRoleLabel,
    momReact,
    typicalPhrase,
    conflictInput.concernId
  );
  const childObservedBehavior = formatChildObserved(childName, childReact);

  const ch2Claims: SentenceClaim[] = [
    {
      claimId: "ch2_c1",
      claimType: "DIRECT_INPUT",
      chapter: 2,
      text: momObservedReaction,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
    {
      claimId: "ch2_c2",
      claimType: "DIRECT_INPUT",
      chapter: 2,
      text: childObservedBehavior,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
  ];
  allSentenceClaims.push(...ch2Claims);

  // ── Chapter 03: 상호작용 종합 ──
  const ch3Claims: SentenceClaim[] = [
    {
      claimId: "ch3_c1",
      claimType: "OBSERVED",
      chapter: 3,
      text: rule.childPerspectiveSummary,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
    {
      claimId: "ch3_c2",
      claimType: "OBSERVED",
      chapter: 3,
      text: rule.momPerspectiveSummary,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
    {
      claimId: "ch3_c3",
      claimType: "INFERRED",
      chapter: 3,
      text: rule.synthesisSummary,
      evidenceRefs: refs,
      inferenceLevel: "medium",
    },
  ];
  allSentenceClaims.push(...ch3Claims);

  // ── Chapter 04: Conflict Chain Steps ──
  // P2.4 긴급 수정 (PAID REPORT CONTENT INTEGRITY GATE §1·§3·§4): CH01과 완전히 동일한
  // Primary Interaction Context(sceneOpener / childSceneObserved / caregiverSceneReaction /
  // escalationFact)로 4단계를 구성한다. 예전에는 isCollaborative 여부나 ruleId 에 따라
  // 완전히 다른 하드코딩 장면(예: "새로운 환경에서 멈춰 서서 살핌")을 별도로 썼기 때문에,
  // 실제 입력(Current Conflict)과 모순되는 문장이 같은 리포트 안에 섞여 나왔다.
  // isCollaborative 기반 Low-Friction 서술은 실제 마찰 입력이 있는 이상 사용하지 않는다.
  // P2.5 §3 §5: 흐름도는 장면 전문을 다시 복사하는 곳이 아니다.
  // 예전에는 2·3·4번 칸이 SECTION 02 의 장면 문장을 그대로 다시 실어서, 같은 사실이
  // 리포트 안에서 3회 이상 반복됐다(보호자 발화는 장면 + 흐름도 + BEFORE = 3회).
  // 여기서는 "어느 칸에서 무슨 종류의 움직임이 일어나는가"만 짧은 구조 라벨로 보여준다.
  const chainSteps = [
    {
      stepNumber: 1 as const,
      stage: "trigger" as const,
      actor: "둘 다" as const,
      description: `${sceneOpener}.`,
    },
    {
      stepNumber: 2 as const,
      stage: "child_reaction" as const,
      actor: "아이" as const,
      description: insights.chain.childStep,
    },
    {
      stepNumber: 3 as const,
      stage: "mom_reaction" as const,
      actor: caregiverRoleLabel,
      description: insights.chain.caregiverStep,
    },
    {
      stepNumber: 4 as const,
      stage: "escalation" as const,
      actor: "둘 다" as const,
      description: insights.chain.resultStep,
    },
  ];

  const ch4Claims: SentenceClaim[] = [
    {
      claimId: "ch4_c1",
      claimType: "RECOMMENDATION",
      chapter: 4,
      text: `${rule.whereToBreakSummary.breakActionTitle}: ${rule.whereToBreakSummary.breakActionDetail}`,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
  ];
  allSentenceClaims.push(...ch4Claims);

  // ── Chapter 05: 같은 순간 반복되는 반응 (관찰 근거) ──
  // P2.4 긴급 수정 (§4 LOW-FRICTION BRANCH LOCK): isCollaborative 만으로 "지금 우리 둘이
  // 잘 맞는 지점"이라는 별도 하드코딩 문구로 바꿔치기하지 않는다. 실제 Current Conflict에
  // 마찰(subsequentEscalation)이 입력된 이상, 근거 없이 "잘 맞는다"고 안심시키는 문장을
  // 만들 수 없다. CH02와 동일한 실제 입력 기반 문장을 그대로 재사용한다.
  const ch5Title = `이 순간 ${caregiverRoleLabel} 쪽에서 반복되는 반응`;
  const exhaustionReason = momObservedReaction;
  const comfortMessage = childObservedBehavior;

  const ch5Claims: SentenceClaim[] = [
    {
      claimId: "ch5_c1",
      claimType: "DIRECT_INPUT",
      chapter: 5,
      text: exhaustionReason,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
    {
      claimId: "ch5_c2",
      claimType: "DIRECT_INPUT",
      chapter: 5,
      text: comfortMessage,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
  ];
  allSentenceClaims.push(...ch5Claims);

  // ── Chapter 06/07/08: 실제 장면 기반 추천 (P2.4 PAID REPORT RECOMMENDATION ALIGNMENT) ──
  // Priority: ① CurrentConflict 실제 입력(scenarioId 매칭) → ② Primary Interaction Rule(fallback).
  // scenarioId 는 Setup에서 사용자가 직접 고른 구체적 장면(conflictScenarios.ts, 30종)이라
  // 10문항/미니체크로 매칭되는 일반 InteractionRule보다 실제 Current Conflict에 훨씬 가깝다.
  // P2.2V.6: 시나리오 추천 문구도 반드시 단일 렌더러를 거쳐 관계명을 채운다.
  // (예: sc_sleep_night_waking 의 "{{CG}} 여기 있어" -> 아빠/외할머니 …)
  const rawScenarioRec = conflictInput.scenarioId
    ? SCENARIO_RECOMMENDATIONS[conflictInput.scenarioId]
    : undefined;
  const scenarioRec = rawScenarioRec
    ? applyCaregiverLabel(rawScenarioRec, caregiverRoleLabel)
    : undefined;
  const scenarioMeta = conflictInput.scenarioId
    ? CONFLICT_SCENARIOS.find((s) => s.scenarioId === conflictInput.scenarioId)
    : undefined;
  // Traceability(§8, 고객 화면 미노출): evidenceRefs 에 scenario/concern/rule 출처를 함께 기록.
  const recTraceRefs = Array.from(
    new Set(
      [
        ...refs,
        `concern:${conflictInput.concernId}`,
        conflictInput.scenarioId ? `scenario:${conflictInput.scenarioId}` : null,
        scenarioRec ? "source:scenario" : "source:rule_fallback",
        `rule:${rule.ruleId}`,
      ].filter((r): r is string => Boolean(r))
    )
  );

  const beforeQuote = typicalPhrase || momReact;
  const situationLabel = scenarioMeta?.title ?? rule.samplePhrases[0]?.situation ?? concernLabel;

  const threePhrases = scenarioRec
    ? [
        {
          phraseId: `scenario_${conflictInput.scenarioId}`,
          situation: situationLabel,
          before: beforeQuote,
          after: scenarioRec.phraseAfter,
          whyItMayHelp: scenarioRec.phraseWhy,
          evidenceRefs: recTraceRefs,
        },
      ]
    : rule.samplePhrases.map((p) => ({ ...p, evidenceRefs: p.evidenceRefs || recTraceRefs }));

  const threeActions = scenarioRec
    ? scenarioRec.actions.map((a, idx) => ({
        actionId: `scenario_${conflictInput.scenarioId}_${idx + 1}`,
        actionTitle: a.title,
        actionDetail: a.detail,
        whyItMayHelp: a.whyItMayHelp,
        evidenceRefs: recTraceRefs,
      }))
    : rule.sampleActions.map((a) => ({ ...a, evidenceRefs: a.evidenceRefs || recTraceRefs }));

  const oneSentenceAnchor = scenarioRec?.anchor ?? rule.anchorPromise;

  const ch8Claims: SentenceClaim[] = [
    {
      claimId: "ch8_c1",
      claimType: "RECOMMENDATION",
      chapter: 8,
      text: oneSentenceAnchor,
      evidenceRefs: recTraceRefs,
      inferenceLevel: "direct",
    },
  ];
  allSentenceClaims.push(...ch8Claims);

  // ── Fortune Reflection (Reflective Layer) ──
  let fortuneReflection: SignatureReport["fortuneReflection"] = undefined;
  if (childFortune) {
    const el = childFortune.dayMasterElement;
    const allPatterns = childEvidences.map((e) => e.patternId);
    const isCautiousObs = allPatterns.some((p) =>
      p.includes("observe") || p.includes("reassurance") || p.includes("scan")
    );
    const isFlexibleObs = allPatterns.some((p) =>
      p.includes("flexible") || p.includes("switches_readily")
    );
    const isStructuredObs = allPatterns.some((p) =>
      p.includes("completion") || p.includes("own_way") || p.includes("reason")
    );
    const isPraiseObs = allPatterns.some((p) => p.includes("praise"));
    const isSelfDirObs = allPatterns.some((p) => p.includes("independent") || p.includes("asserts"));

    if ((el === "fire" || el === "wood") && isCautiousObs && !isSelfDirObs && !isPraiseObs) {
      fortuneReflection = {
        status: "CONFLICTING",
        text: `${childName}의 출생정보에서 보는 힌트와 현재 관찰된 모습이 다른 부분도 있었어요. 이번 결과는 실제 행동을 우선했어요.`,
        evidenceRefs: [`fortune:dayMaster_${el}`],
      };
    } else if (el === "metal" && isFlexibleObs && !isStructuredObs) {
      fortuneReflection = {
        status: "CONFLICTING",
        text: `${childName}의 출생정보에서 보는 힌트와 현재 관찰된 모습이 다른 부분도 있었어요. 이번 결과는 실제 행동을 우선했어요.`,
        evidenceRefs: [`fortune:dayMaster_${el}`],
      };
    } else if (((el === "wood" || el === "fire") && isSelfDirObs) || (el === "fire" && isPraiseObs) || (el === "metal" && isStructuredObs) || ((el === "water" || el === "earth") && isCautiousObs)) {
      let hintText = "";
      if ((el === "wood" || el === "fire") && isSelfDirObs) {
        hintText = `${childName}의 출생정보에서는 자기 방식으로 움직이려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.`;
      } else if (el === "fire" && isPraiseObs) {
        hintText = `${childName}의 출생정보에서는 에너지를 활발하게 드러내려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.`;
      } else if (el === "metal" && isStructuredObs) {
        hintText = `${childName}의 출생정보에서는 자기 기준이나 마침표를 챙기려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.`;
      } else {
        hintText = `${childName}의 출생정보에서는 상황을 천천히 살피려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.`;
      }
      fortuneReflection = {
        status: "ALIGNED",
        text: hintText,
        evidenceRefs: [`fortune:dayMaster_${el}`],
      };
    }
  }

  return {
    meta: {
      childName,
      childAgeDisplay: ageDisplay,
      concernLabel,
      momName,
      caregiverRoleLabel,
      caregiverRole,
    },
    twoPersonSummary,
    chapter01_recurringScene: {
      title: "지금 우리 집에서 반복되는 장면",
      narrative: sceneNarrative,
      sceneKeywords,
      evidenceRefs: refs,
      sentenceClaims: ch1Claims,
    },
    chapter02_perspectiveGap: {
      momPerspective: {
        intention: momObservedReaction,
        possibleFeeling: "",
      },
      childPerspective: {
        possibleInterpretation: childObservedBehavior,
        possibleFeeling: "",
      },
      evidenceRefs: refs,
      sentenceClaims: ch2Claims,
    },
    chapter03_interactionPattern: {
      title: rule.title,
      childBehaviorAspect: rule.childPerspectiveSummary,
      momReactionAspect: rule.momPerspectiveSummary,
      synthesis: rule.synthesisSummary,
      evidenceRefs: refs,
      sentenceClaims: ch3Claims,
    },
    chapter04_conflictChain: {
      // P2.5 §7: 제목의 단계 수는 실제 steps 길이에서 파생한다.
      // (예전에는 제목 "4단계" / 설명문 "5단계 패턴" 이 서로 어긋났다)
      title: `${chainSteps.length}단계로 반복되는 흐름`,
      isCollaborative: false,
      steps: chainSteps,
      whereToBreak: {
        // P2.5 §7: Chain 은 항상 1=상황 / 2=아이 반응 / 3=보호자 첫 반응 / 4=결과 구조다.
        // 보호자가 실제로 통제할 수 있는 칸은 3번뿐이므로 끊는 지점을 3번으로 고정한다.
        // (rule 별 targetStep 은 예전 Chain 번호 체계라 breakPointWhy 의 "3번" 서술과 어긋났다)
        targetStep:
          chainSteps.find((s) => s.stage === "mom_reaction")?.stepNumber ??
          rule.whereToBreakSummary.targetStep,
        // fallback 규칙의 "현재 상황을 한 걸음 물러서서 관찰하기"는 유료 조언이 될 수 없다.
        breakActionTitle: match.isFallback
          ? insights.fallbackCopy.breakActionTitle
          : rule.whereToBreakSummary.breakActionTitle,
        breakActionDetail: match.isFallback
          ? insights.fallbackCopy.breakActionDetail
          : rule.whereToBreakSummary.breakActionDetail,
      },
      evidenceRefs: refs,
      sentenceClaims: ch4Claims,
    },
    chapter05_momExhaustionPoint: {
      title: ch5Title,
      isLowFriction: false,
      exhaustionReason,
      comfortMessage,
      evidenceRefs: refs,
      sentenceClaims: ch5Claims,
    },
    chapter06_threePhrases: threePhrases,
    chapter07_threeActions: threeActions,
    chapter08_corePromise: {
      oneSentenceAnchor,
      meaning: "",
      evidenceRefs: recTraceRefs,
      sentenceClaims: ch8Claims,
    },
    // ── P2.5 CONTENT DENSITY: 유료다운 "새 정보" 본체 ──────────
    // 고객이 입력하지 않았고, 입력들을 연결해야 비로소 보이는 구조.
    insightMechanism: {
      focusShift: insights.focusShift,
      escalationPoint: insights.escalationPoint,
      smallestLever: insights.smallestLever,
    },
    breakPointWhy: insights.breakPointWhy,
    fortuneReflection,
    fortuneRelationship,
    allSentenceClaims,
  };
}
