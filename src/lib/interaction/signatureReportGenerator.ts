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
  formatChildReactShort,
  formatEscalationFact,
  mergeCaregiverReactionSentence,
} from "./copyFormatters";

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
  wood: "새로운 시도를 먼저보려는 방향의 힌트로 참고해볼 수 있어요.",
  fire: "감정과 에너지를 바로 표현하는 방향의 힌트로 참고해볼 수 있어요.",
  earth: "자리를 잡고 천천히 익숙해지는 방향의 힌트로 참고해볼 수 있어요.",
  metal: "기준을 분명히 세우고 마무리하려는 방향의 힌트로 참고해볼 수 있어요.",
  water: "상황을 바로 밀어붙이기보다 한 번 살펴보는 방향의 힌트로 참고해볼 수 있어요.",
};

const ELEMENT_HINT_MOM: Record<Element, string> = {
  wood: "상황의 방향을 먼저 정하려는 쪽의 힌트로 참고해볼 수 있어요.",
  fire: "마음을 먼저 말로 꺼내며 빠르게 소통하는 방향의 힌트로 참고해볼 수 있어요.",
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
  const isCollaborative = rule.interactionType === "collaborative";

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
        `${childName}의 시간(時) 힌트에서는 스스로 느끼고 표현하는 활동에 집중하려는 성향이 엿보여요.`
      );
    }

    const momHints: string[] = [
      `${momName}의 출생정보에서는 ${ELEMENT_HINT_MOM[mEl]}`,
    ];
    if (momFortune.hourTenGod) {
      momHints.push(
        `${momName}의 시간(時) 힌트에서는 일상 흐름을 안정적으로 다듬어가려는 성향이 엿보여요.`
      );
    }

    const sharedThemes = [
      `두 사람에게서 비슷하게 보이는 방향: ${childName}와 ${momName} 모두 일상 속에서 상황에 맞춰 반응하려는 태도`,
    ];
    const contrastingThemes = [
      `서로 다른 방식으로 나타나는 지점: 상황을 마주했을 때 ${childName}의 [${ELEMENT_KEYWORD[cEl]}] 방식과 ${momName}의 [${ELEMENT_KEYWORD[mEl]}] 방식의 차이`,
    ];

    const reflectionText = `두 사람의 출생정보에서는 서로 다른 방향의 힌트를 참고해볼 수 있어요. ${cTopic} ${ELEMENT_HINT_CHILD[cEl]} 반면 ${topic(momName)} ${ELEMENT_HINT_MOM[mEl]} 다만 이번 관계 리포트에서는 ${conj(childName)} ${subj(momName)} 실제로 보여준 행동과 반응을 더 중요한 기준으로 봤어요.`;

    const observationContrastText = `출생정보에서는 두 사람의 속도와 표현 방식의 차이를 참고해볼 수 있었지만, 이번 실제 응답에서는 ${concernLabel} 상황에서 관찰된 구체적 행동이 더 분명하게 확인되었어요. 따라서 이 리포트에서는 현재 관찰된 행동을 더 중요하게 반영했습니다.`;

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
      childKeywords.push("식사속도를지켜요", "내방식으로먹고싶어요");
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
      momKeywords.push("골고루다먹이고싶어요", "식사시간을지키려해요");
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

  let misalignedPoint = "";
  if (rule.ruleId === "rule_friction_meal_new_food_hesitation") {
    misalignedPoint = `${momName}는 ‘골고루 먹는 건강한 식사’를 챙기고 싶고, ${cTopic} ‘낯선 음식을 스스로 눈으로 확인할 편안한 틈’이 필요해요.`;
  } else if (rule.ruleId === "rule_friction_meal_autonomy_pacing") {
    misalignedPoint = `${momName}는 ‘정해진 식사 시간과 양’을 지키려 하고, ${cTopic} ‘자신이 원하는 속도와 선택권’을 지키고 싶어 해요.`;
  } else if (rule.ruleId === "rule_friction_sleep_transition_vs_pace") {
    misalignedPoint = `${subj(caregiverRoleLabel)} 정해진 취침 시간에 맞춰 잠자리 흐름을 이어가려는 반응이 있었어요. ${formatChildObserved(childName, childReact)}`;
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
    misalignedPoint = `${momName}가 챙기려는 ${concernLabel}의 방향과 ${cSubj} 세상에 반응하는 고유한 속도가 만나는 지점이에요.`;
  }

  let fortuneRelationshipHint: string | undefined = undefined;
  if (childFortune && momFortune) {
    const cEl = childFortune.dayMasterElement;
    const mEl = momFortune.dayMasterElement;
    fortuneRelationshipHint = `아이: ${ELEMENT_KEYWORD[cEl]} 성향 / ${caregiverRoleLabel}: ${ELEMENT_KEYWORD[mEl]} 성향 · 서로 다른 속도와 표현 방식을 참고해볼 수 있어요.`;
  }

  const twoPersonSummary = {
    childKeywords,
    childSummary: rule.childPerspectiveSummary,
    momKeywords,
    momSummary: rule.momPerspectiveSummary,
    misalignedPoint,
    fortuneRelationshipHint,
  };

  // ── Chapter 01: 지금 우리 집에서 반복되는 장면 (CurrentConflict literal direct ground) ──
  let sceneNarrative = "";
  let sceneKeywords: string[] = [];

  const escalation = conflictInput.subsequentEscalation || "서로의 대화가 길어짐";
  const caregiverSceneReaction = mergeCaregiverReactionSentence(
    caregiverRoleLabel,
    momReact,
    typicalPhrase
  );
  const childSceneObserved = formatChildObserved(childName, childReact);
  const escalationFact = formatEscalationFact(escalation, childName);

  if (conflictInput.concernId === "meal") {
    sceneNarrative = `식사 시간이나 식탁 앞에서 음식을 마주하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["식사 시간", "식습관/편식", "식탁에서의 실랑이"];
  } else if (conflictInput.concernId === "sleep") {
    sceneNarrative = `잠자리에 들어가거나 수면 시간을 앞두고, ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["잠자리", "수면/잠자리", "재촉과 미루기"];
  } else if (conflictInput.concernId === "tantrum") {
    sceneNarrative = `뜻대로 되지 않아 감정이 일어나는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["감정 표현", "떼쓰기/울음", "대화의 타이밍"];
  } else if (conflictInput.concernId === "shyness") {
    sceneNarrative = `새로운 장소나 낯선 환경을 마주하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["새로운 환경", "낯가림/수줍음", "참여 권유"];
  } else if (conflictInput.concernId === "discipline") {
    sceneNarrative = `일상의 규칙이나 할 일을 챙겨야 하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["일상 규칙", "훈육/규칙", "실랑이"];
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    sceneNarrative = `외출 준비나 상황을 전환해야 하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["외출 준비", "놀이 마침표", "속도 차이"];
  } else if (rule.ruleId === "rule_friction_observation_vs_stress") {
    sceneNarrative = `새로운 장소나 낯선 환경을 마주하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["새로운 환경", "주변 탐색", "참여 권유"];
  } else if (rule.ruleId === "rule_friction_emotion_vs_explanation") {
    sceneNarrative = `뜻대로 되지 않아 감정이 일어나는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["감정 표현", "이유 설명", "대화의 타이밍"];
  } else if (rule.ruleId === "rule_friction_autonomy_vs_firmness") {
    sceneNarrative = `일상의 규칙이나 할 일을 챙겨야 하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["일상 규칙", "자기주장", "실랑이"];
  } else if (rule.ruleId === "rule_collab_observation_and_patience") {
    sceneNarrative = `새로운 환경이나 활동을 시작하는 순간. ${childSceneObserved.replace(/\.$/, "")}. ${caregiverSceneReaction} 그 뒤 ${escalationFact}`;
    sceneKeywords = ["신중한 탐색", "묵묵한 기다림", "편안한 대화"];
  } else {
    sceneNarrative = `${childName}와(과) 일상을 보내다 보면 특히 ${concernLabel} 상황에서 ${childReact}, ${momReact}. ${escalation}.`;
    sceneKeywords = [concernLabel, "속도 차이", "반응 방식"];
  }

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
    typicalPhrase
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
  let chainSteps = [];

  if (isCollaborative) {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `새로운 환경을 마주해 ${cSubj} 멈춰 서서 주변을 살핍니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: `${subj(caregiverRoleLabel)} 재촉하지 않고 곁에서 손을 잡고 조용히 기다려줍니다.`,
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: `${cSubj} 스스로 주변 상황을 파악한 뒤 편안하게 둘러봅니다.`,
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: "자연스럽게 다음 행동이나 참여로 한 걸음 내딛습니다.",
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "큰 마찰 없이 서로 편안하게 일상 흐름을 이어갑니다.",
      },
    ];
  } else if (conflictInput.concernId === "meal") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: "식사 시간, 식탁에 차려진 반찬이나 음식을 마주하는 순간.",
      },
      {
        stepNumber: 2 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: formatChildReactShort(childName, childReact),
      },
      {
        stepNumber: 3 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: mergeCaregiverReactionSentence(caregiverRoleLabel, momReact, typicalPhrase),
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `그다음 ${escalationFact}`,
      },
    ];
  } else if (conflictInput.concernId === "sleep") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: "잠자리 시간이 됨.",
      },
      {
        stepNumber: 2 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: formatChildReactShort(childName, childReact),
      },
      {
        stepNumber: 3 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: mergeCaregiverReactionSentence(caregiverRoleLabel, momReact, typicalPhrase),
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `그다음 ${escalationFact}`,
      },
    ];
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `${cSubj} 하던 놀이의 마지막 조립이나 정리를 이어가려 합니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: `일정에 늦지 않으려 ${subj(caregiverRoleLabel)} '빨리 신발 신자, 늦었어!' 하고 재촉합니다.`,
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: "하던 흐름이 끊기자 아이가 제자리에 멈춰 서서 신발 신기를 미룹니다.",
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `${caregiverRoleLabel}의 말이 반복되고 아이도 버티며 실랑이가 길어집니다.`,
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "결국 출발은 했지만 서로 감정적 피로감을 안은 채 하루가 시작됩니다.",
      },
    ];
  } else if (rule.ruleId === "rule_friction_observation_vs_stress") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `새로운 장소를 마주해 ${cSubj} ${caregiverRoleLabel} 곁에 서서 주변을 지켜봅니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: `아이가 머뭇거리자 ${subj(caregiverRoleLabel)} '어서 가서 인사해보자' 하고 참여를 권합니다.`,
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: `아이가 ${caregiverRoleLabel} 곁에 머물며 살펴보는 시간이 더 길어집니다.`,
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `${caregiverRoleLabel}의 권유하는 말이 반복되며 어색한 긴장감이 생깁니다.`,
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "자연스럽게 어울리지 못하고 서로 불편한 마음으로 마무리됩니다.",
      },
    ];
  } else if (rule.ruleId === "rule_friction_emotion_vs_explanation") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `뜻대로 되지 않는 상황에서 ${childName}의 속상함과 울음이 일어납니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: `상황을 이해시키려 ${subj(caregiverRoleLabel)} 차근차근 논리적인 이유를 설명합니다.`,
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: "감정이 가라앉지 않은 상태에서 설명이 바로 전달되지 않습니다.",
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `${caregiverRoleLabel}의 설명이 길어지고 아이의 울음도 이어지며 대화가 어긋납니다.`,
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "울음이 잦아든 뒤에도 서로 지쳐 말수가 줄어듭니다.",
      },
    ];
  } else if (rule.ruleId === "rule_friction_autonomy_vs_firmness") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `양치나 정리 등 꼭 해야 하는 규칙 상황에서 자기가 고른 방식을 주장합니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: "정해진 일과를 위해 '지금 해야 할 시간이야, 어서 해' 하고 단호하게 안내합니다.",
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: "선택권이 없다고 느낀 아이가 자기 방식을 굽히지 않고 버팁니다.",
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `원칙을 지키려는 ${conj(caregiverRoleLabel)} 고집을 꺾지 않는 아이의 실랑이가 길어집니다.`,
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "결국 억지로 끝냈지만 서로 감정이 상한 채 일과가 마무리됩니다.",
      },
    ];
  } else {
    const concernSceneOpeners: Partial<Record<string, string>> = {
      tantrum: "뜻대로 되지 않아 감정이 일어나는 순간",
      shyness: "새로운 장소나 낯선 환경을 마주하는 순간",
      discipline: "일상의 규칙이나 할 일을 챙겨야 하는 순간",
    };
    const opener =
      concernSceneOpeners[conflictInput.concernId] ||
      `${concernLabel} 상황에서 반복되는 순간`;
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `${opener}.`,
      },
      {
        stepNumber: 2 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: formatChildReactShort(childName, childReact),
      },
      {
        stepNumber: 3 as const,
        stage: "mom_reaction" as const,
        actor: caregiverRoleLabel,
        description: mergeCaregiverReactionSentence(caregiverRoleLabel, momReact, typicalPhrase),
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `그다음 ${escalationFact}`,
      },
    ];
  }

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
  let ch5Title = `이 순간 ${caregiverRoleLabel} 쪽에서 반복되는 반응`;
  let exhaustionReason = "";
  let comfortMessage = "";

  if (isCollaborative) {
    ch5Title = "지금 우리 둘이 잘 맞는 지점";
    exhaustionReason = `${cTopic} 새로운 환경에서 먼저 살펴보는 모습이 있었고, ${topic(caregiverRoleLabel)} 그 순간 속도를 올리기보다 기다리는 반응을 보였어요. 두 방식이 현재 장면에서는 큰 마찰 없이 이어지고 있어요.`;
    comfortMessage = `아이의 신중한 속도를 존중해주는 ${caregiverRoleLabel}의 차분한 기다림이 서로에게 편안한 소통의 바탕이 되고 있습니다.`;
  } else {
    exhaustionReason = formatCaregiverObservedReaction(
      caregiverRoleLabel,
      momReact,
      typicalPhrase
    );
    comfortMessage = formatChildObserved(childName, childReact);
  }

  const ch5Claims: SentenceClaim[] = [
    {
      claimId: "ch5_c1",
      claimType: isCollaborative ? "OBSERVED" : "DIRECT_INPUT",
      chapter: 5,
      text: exhaustionReason,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
    {
      claimId: "ch5_c2",
      claimType: isCollaborative ? "EMOTIONAL_COPY" : "DIRECT_INPUT",
      chapter: 5,
      text: comfortMessage,
      evidenceRefs: refs,
      inferenceLevel: isCollaborative ? "reflective" : "direct",
    },
  ];
  allSentenceClaims.push(...ch5Claims);

  // ── Chapter 08: Core Promise Anchor ──
  let oneSentenceAnchor = rule.anchorPromise;
  if (
    conflictInput.concernId === "sleep" &&
    rule.ruleId === "rule_friction_sleep_transition_vs_pace"
  ) {
    oneSentenceAnchor = `${childName}에게 잠자리로 가자고 말하기 전, 하던 활동의 마지막 지점을 먼저 같이 정해보세요.`;
  }

  const ch8Claims: SentenceClaim[] = [
    {
      claimId: "ch8_c1",
      claimType: "RECOMMENDATION",
      chapter: 8,
      text: oneSentenceAnchor,
      evidenceRefs: refs,
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
      title: isCollaborative
        ? "평소 서로가 맞물리는 대화 흐름"
        : chainSteps.length === 4
        ? "4단계 반복되는 갈등 흐름"
        : "5단계 반복되는 갈등 흐름",
      isCollaborative,
      steps: chainSteps,
      whereToBreak: {
        targetStep: rule.whereToBreakSummary.targetStep,
        breakActionTitle: rule.whereToBreakSummary.breakActionTitle,
        breakActionDetail: rule.whereToBreakSummary.breakActionDetail,
      },
      evidenceRefs: refs,
      sentenceClaims: ch4Claims,
    },
    chapter05_momExhaustionPoint: {
      title: ch5Title,
      isLowFriction: isCollaborative,
      exhaustionReason,
      comfortMessage,
      evidenceRefs: refs,
      sentenceClaims: ch5Claims,
    },
    chapter06_threePhrases: rule.samplePhrases.map((p) => ({
      ...p,
      evidenceRefs: p.evidenceRefs || refs,
    })),
    chapter07_threeActions: rule.sampleActions.map((a) => ({
      ...a,
      evidenceRefs: a.evidenceRefs || refs,
    })),
    chapter08_corePromise: {
      oneSentenceAnchor,
      meaning: "",
      evidenceRefs: refs,
      sentenceClaims: ch8Claims,
    },
    fortuneReflection,
    fortuneRelationship,
    allSentenceClaims,
  };
}
