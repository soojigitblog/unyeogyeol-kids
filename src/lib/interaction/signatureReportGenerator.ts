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
// 9. Real Mom Fortune Facts & ParentChildFortuneReflection: 사주 궁합 점수(점수, 찰떡궁합 등) 금지, 엄마×아이 출생정보 교차 보조 힌트 제공 + 관찰 우선 원칙 명시.

import type {
  BehaviorEvidence,
  ChildProfile,
  CurrentConflictInput,
  Element,
  FortuneFacts,
  MomEvidence,
  MomProfile,
  ParentChildFortuneReflection,
  SentenceClaim,
  SignatureReport,
} from "@/lib/types";
import { computeAge } from "@/lib/age";
import { computeFortuneFacts } from "@/lib/fortune/engine";
import { matchInteractionRule } from "./interactionEngine";

const ELEMENT_HINT_CHILD: Record<Element, string> = {
  wood: "호기심을 가지고 새로운 시도를 향해 뻗어나가려는 기운의 힌트가 있어요.",
  fire: "자신의 감정과 에너지를 솔직하고 환하게 표현하려는 기운의 힌트가 있어요.",
  earth: "상황을 든든하게 품고 안정감을 유지하려는 기운의 힌트가 있어요.",
  metal: "매듭을 분명히 짓고 자기 기준을 야무지게 챙기려는 기운의 힌트가 있어요.",
  water: "상황을 조용히 관찰하고 유연하게 스며들려는 기운의 힌트가 있어요.",
};

const ELEMENT_HINT_MOM: Record<Element, string> = {
  wood: "상황을 주도적으로 이끌고 바른 방향으로 성장시키려는 기운의 힌트가 보여요.",
  fire: "열정적으로 마음을 표현하고 빠르게 소통하며 챙겨주려는 기운의 힌트가 보여요.",
  earth: "묵묵히 상황을 포용하고 가정의 중심을 지키려는 기운의 힌트가 보여요.",
  metal: "규칙과 일정을 명확하게 정리하고 올바른 방향을 잡으려는 기운의 힌트가 보여요.",
  water: "상황을 유연하게 살피고 아이 마음을 깊이 헤아리려는 기운의 힌트가 보여요.",
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
  momProfile?: MomProfile | { name?: string; birthDate?: string; birthTimeKnown?: boolean; birthTime?: string } | null
): SignatureReport {
  const ageInfo = computeAge(profile.birthDate);
  const ageDisplay = ageInfo?.ageDisplay || "만 3세";
  const childName = profile.name || "우리 아이";
  const momName = momProfile?.name || "엄마";

  const match = matchInteractionRule(
    childEvidences,
    momEvidences,
    conflictInput.concernId
  );
  const rule = match.rule;
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
    only_with_mom: "엄마 껌딱지",
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
  if (momProfile?.birthDate) {
    momFortune = computeFortuneFacts(
      momProfile.birthDate,
      momProfile.birthTimeKnown ?? false,
      momProfile.birthTime
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
      `두 사람에게서 비슷하게 보이는 방향: ${childName}와 ${momName} 모두 일상 속에서 서로의 마음을 살피려는 태도`,
    ];
    const contrastingThemes = [
      `서로 다른 방식으로 나타나는 지점: 상황을 마주했을 때 ${childName}의 [${ELEMENT_KEYWORD[cEl]}] 방식과 ${momName}의 [${ELEMENT_KEYWORD[mEl]}] 방식의 차이`,
    ];

    const reflectionText = `두 사람의 출생정보를 함께 보면, ${childName}는 ${ELEMENT_HINT_CHILD[cEl]} 반면 ${momName}는 ${ELEMENT_HINT_MOM[mEl]} 이러한 기질적 특성은 일상에서 상황을 바라보는 속도와 표현 방식의 차이로 이어질 수 있는 참고 힌트예요.`;

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
  const childPatterns = childEvidences.map((e) => e.observedPattern);
  const childKeywords: string[] = [];
  if (conflictInput.concernId === "meal") {
    if (childPatterns.some((p) => p.includes("observe") || p.includes("reassurance"))) {
      childKeywords.push("새로운음식에신중해요", "눈으로먼저살펴요");
    } else if (childPatterns.some((p) => p.includes("completion") || p.includes("own_way"))) {
      childKeywords.push("나만의식사속도가있어요", "스스로선택하고싶어요");
    } else {
      childKeywords.push("식사속도를지켜요", "내방식으로먹고싶어요");
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

  let misalignedPoint = "";
  if (rule.ruleId === "rule_friction_meal_new_food_hesitation") {
    misalignedPoint = `${momName}는 ‘골고루 먹는 건강한 식사’를 챙기고 싶고, ${childName}는 ‘낯선 음식을 스스로 눈으로 확인할 편안한 틈’이 필요해요.`;
  } else if (rule.ruleId === "rule_friction_meal_autonomy_pacing") {
    misalignedPoint = `${momName}는 ‘정해진 식사 시간과 양’을 지키려 하고, ${childName}는 ‘자신이 원하는 속도와 선택권’을 지키고 싶어 해요.`;
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    misalignedPoint = `${momName}는 ‘이제 가야 할 시간’을 보고, ${childName}는 ‘아직 끝나지 않은 놀이’를 보고 있어요.`;
  } else if (rule.ruleId === "rule_friction_observation_vs_stress") {
    misalignedPoint = `${momName}는 ‘어서 편하게 어울리는 모습’을 바라고, ${childName}는 ‘주변이 익숙해질 관찰 시간’이 필요해요.`;
  } else if (rule.ruleId === "rule_friction_emotion_vs_explanation") {
    misalignedPoint = `${momName}는 ‘상황을 납득할 논리적 이유’를 먼저 전하고, ${childName}는 ‘속상한 감정의 환기’가 먼저 필요해요.`;
  } else if (rule.ruleId === "rule_friction_autonomy_vs_firmness") {
    misalignedPoint = `${momName}는 ‘지켜야 할 분명한 규칙’을 안내하고, ${childName}는 ‘스스로 고르고 주도할 작은 선택지’를 원해요.`;
  } else if (rule.ruleId === "rule_collab_observation_and_patience") {
    misalignedPoint = `${childName}의 신중한 관찰 속도를 ${momName}가 묵묵히 지켜봐 주며 서로 편안한 호흡을 맞추고 있어요.`;
  } else {
    misalignedPoint = `${momName}가 챙기려는 ${concernLabel}의 방향과 ${childName}가 세상에 반응하는 고유한 속도가 만나는 지점이에요.`;
  }

  let fortuneRelationshipHint: string | undefined = undefined;
  if (childFortune && momFortune) {
    const cEl = childFortune.dayMasterElement;
    const mEl = momFortune.dayMasterElement;
    fortuneRelationshipHint = `아이: ${ELEMENT_KEYWORD[cEl]} 성향 / 엄마: ${ELEMENT_KEYWORD[mEl]} 성향 · 서로 다른 속도와 표현 방식을 참고해볼 수 있어요.`;
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

  const childReact = conflictInput.childFirstReaction || `${childName}가 하던 방식을 이어가려 함`;
  const momReact = conflictInput.momFirstReaction || "엄마가 상황을 정리하려 안내함";
  const escalation = conflictInput.subsequentEscalation || "서로의 대화가 길어짐";
  const typicalPhrase = conflictInput.momTypicalPhrase;

  if (conflictInput.concernId === "meal" || rule.ruleId.startsWith("rule_friction_meal_")) {
    sceneNarrative = `식사 시간이나 식탁 앞에서 음식을 마주하는 순간. ${childName}는 ${childReact}. 엄마는 아이의 건강과 식사 지도를 위해 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}. 그 뒤 ${escalation}.`;
    sceneKeywords = ["식사 시간", "식습관/편식", "식탁에서의 실랑이"];
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    sceneNarrative = `외출 준비나 상황을 전환해야 하는 순간. ${childName}는 ${childReact}. 엄마는 정해진 일정을 위해 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}. 그 뒤 ${escalation}.`;
    sceneKeywords = ["외출 준비", "놀이 마침표", "속도 차이"];
  } else if (rule.ruleId === "rule_friction_observation_vs_stress") {
    sceneNarrative = `새로운 장소나 낯선 환경을 마주하는 순간. ${childName}는 ${childReact}. 엄마는 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}. 그 뒤 ${escalation}.`;
    sceneKeywords = ["새로운 환경", "주변 탐색", "참여 권유"];
  } else if (rule.ruleId === "rule_friction_emotion_vs_explanation") {
    sceneNarrative = `뜻대로 되지 않아 감정이 일어나는 순간. ${childName}는 ${childReact}. 엄마는 상황을 풀기 위해 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}. 그 뒤 ${escalation}.`;
    sceneKeywords = ["감정 표현", "이유 설명", "대화의 타이밍"];
  } else if (rule.ruleId === "rule_friction_autonomy_vs_firmness") {
    sceneNarrative = `일상의 규칙이나 할 일을 챙겨야 하는 순간. ${childName}는 ${childReact}. 엄마는 일과를 위해 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}. 그 뒤 ${escalation}.`;
    sceneKeywords = ["일상 규칙", "자기주장", "실랑이"];
  } else if (rule.ruleId === "rule_collab_observation_and_patience") {
    sceneNarrative = `새로운 환경이나 활동을 시작하는 순간. ${childName}는 ${childReact}. 엄마는 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}. 그 뒤 ${escalation}.`;
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

  // ── Chapter 02: 같은 상황, 다른 시선 ──
  const momIntention =
    conflictInput.concernId === "meal" || rule.ruleId.startsWith("rule_friction_meal_")
      ? "아이에게 건강한 음식을 골고루 먹이고 올바른 식습관을 길러주고 싶은 마음"
      : rule.ruleId === "rule_friction_completion_vs_time"
      ? "정해진 시간과 다음 일정에 늦지 않도록 챙겨주려는 마음"
      : rule.ruleId === "rule_friction_observation_vs_stress"
      ? "아이가 어색해하지 않고 자연스럽게 참여하도록 돕고 싶은 마음"
      : rule.ruleId === "rule_friction_emotion_vs_explanation"
      ? "아이가 상황을 이해하고 수긍할 수 있도록 이유를 알려주려는 마음"
      : rule.ruleId === "rule_friction_autonomy_vs_firmness"
      ? "지켜야 할 규칙을 바르게 가르쳐주고 싶은 마음"
      : "아이의 페이스를 살피며 상황에 맞게 돕고 싶은 마음";

  const childInterpretation =
    conflictInput.concernId === "meal" || rule.ruleId.startsWith("rule_friction_meal_")
      ? "익숙하지 않은 음식에 대한 감각적 부담이 있거나 자신의 식사 속도를 지키고 싶은 상태에서 식사를 권유받는 상황으로 받아들여질 수 있어요."
      : rule.ruleId === "rule_friction_completion_vs_time"
      ? "하던 행동의 마침표를 찍지 못한 채 갑작스럽게 끊기는 상황으로 받아들여질 수 있어요."
      : rule.ruleId === "rule_friction_observation_vs_stress"
      ? "주변이 안전한지 스스로 확인할 시간이 필요한 상태에서 참여를 권유받는 상황으로 닿을 수 있어요."
      : rule.ruleId === "rule_friction_emotion_vs_explanation"
      ? "속상한 감정이 가라앉기 전에 설명부터 듣는 상황으로 받아들여질 수 있어요."
      : rule.ruleId === "rule_friction_autonomy_vs_firmness"
      ? "자신의 생각이나 선택권이 배제된 채 일방적으로 안내받는 상황으로 여겨질 수 있어요."
      : "자신만의 속도로 주변을 탐색하며 적응해가는 중일 수 있어요.";

  const ch2Claims: SentenceClaim[] = [
    {
      claimId: "ch2_c1",
      claimType: "INFERRED",
      chapter: 2,
      text: momIntention,
      evidenceRefs: refs,
      inferenceLevel: "low",
    },
    {
      claimId: "ch2_c2",
      claimType: "INFERRED",
      chapter: 2,
      text: childInterpretation,
      evidenceRefs: refs,
      inferenceLevel: "low",
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
        description: `새로운 환경을 마주해 ${childName}가 멈춰 서서 주변을 살핍니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: "엄마" as const,
        description: "엄마가 재촉하지 않고 곁에서 손을 잡고 조용히 기다려줍니다.",
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: `${childName}가 스스로 주변 상황을 파악한 뒤 편안하게 둘러봅니다.`,
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
  } else if (conflictInput.concernId === "meal" || rule.ruleId.startsWith("rule_friction_meal_")) {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `식사 시간, 식탁에 차려진 반찬이나 음식을 마주하는 순간.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: "엄마" as const,
        description: `엄마가 ${momReact}${typicalPhrase ? ` “${typicalPhrase}”` : ""}.`,
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: `${childName}가 ${childReact}.`,
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: `그다음 ${escalation}.`,
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: `권유와 거부가 반복되면 식사 시간이 서로 피곤하고 부담스럽게 느껴질 수도 있어요.`,
      },
    ];
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `${childName}가 하던 놀이의 마지막 조립이나 정리를 이어가려 합니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: "엄마" as const,
        description: "일정에 늦지 않으려 엄마가 '빨리 신발 신자, 늦었어!' 하고 재촉합니다.",
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
        description: "엄마의 말이 반복되고 아이도 버티며 실랑이가 길어집니다.",
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
        description: `새로운 장소를 마주해 ${childName}가 엄마 곁에 서서 주변을 지켜봅니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: "엄마" as const,
        description: "아이가 머뭇거리자 엄마가 '어서 가서 인사해보자' 하고 참여를 권합니다.",
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: "아이가 엄마 곁에 머물며 살펴보는 시간이 더 길어집니다.",
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: "엄마의 권유하는 말이 반복되며 어색한 긴장감이 생깁니다.",
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
        actor: "엄마" as const,
        description: "상황을 이해시키려 엄마가 차근차근 논리적인 이유를 설명합니다.",
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
        description: "엄마의 설명이 길어지고 아이의 울음도 이어지며 대화가 어긋납니다.",
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
        actor: "엄마" as const,
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
        description: "원칙을 지키려는 엄마와 고집을 꺾지 않는 아이의 실랑이가 길어집니다.",
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "결국 억지로 끝냈지만 서로 감정이 상한 채 일과가 마무리됩니다.",
      },
    ];
  } else {
    chainSteps = [
      {
        stepNumber: 1 as const,
        stage: "trigger" as const,
        actor: "아이" as const,
        description: `${childName}가 특정 상황에서 자신만의 방식을 고수하거나 머뭇거립니다.`,
      },
      {
        stepNumber: 2 as const,
        stage: "mom_reaction" as const,
        actor: "엄마" as const,
        description: "엄마가 상황을 수습하거나 이끌기 위해 안내 또는 개입을 시도합니다.",
      },
      {
        stepNumber: 3 as const,
        stage: "child_reaction" as const,
        actor: "아이" as const,
        description: `${childName}가 개입에 대해 저항하거나 자신의 속도를 지키려 합니다.`,
      },
      {
        stepNumber: 4 as const,
        stage: "escalation" as const,
        actor: "둘 다" as const,
        description: "서로의 방식이 맞물리지 않아 긴장감이 올라갑니다.",
      },
      {
        stepNumber: 5 as const,
        stage: "exhausted_end" as const,
        actor: "둘 다" as const,
        description: "상황은 마무리되었지만 서로 감정적 소모감을 느끼게 됩니다.",
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

  // ── Chapter 05: 엄마가 이 순간 특히 지치는 이유 / 잘 맞는 지점 ──
  let ch5Title = "엄마가 이 순간 특히 지치는 이유";
  let exhaustionReason = "";
  let comfortMessage = "";

  if (isCollaborative) {
    ch5Title = "지금 우리 둘이 잘 맞는 지점";
    exhaustionReason = `${childName}는 새로운 환경에서 먼저 살펴보는 시간이 필요한 모습이 있었고, 엄마는 그 순간 속도를 올리기보다 기다리는 반응을 보였어요. 두 방식이 현재 장면에서는 큰 마찰 없이 이어지고 있어요.`;
    comfortMessage = "아이의 신중한 속도를 존중해주는 엄마의 차분한 기다림이 서로에게 편안한 소통의 바탕이 되고 있습니다.";
  } else if (conflictInput.concernId === "meal" || rule.ruleId.startsWith("rule_friction_meal_")) {
    exhaustionReason =
      "아이의 건강과 성장을 위해 정성껏 차린 음식을 거부당할 때, 매 식사 시간마다 감정 소모와 답답함이 커지기 쉬워요.";
    comfortMessage =
      "엄마의 요리나 양육 태도가 잘못된 것이 아니라, 낯선 음식에 신중하게 다가서는 아이의 탐색 방식과 영양을 챙기려는 엄마의 마음이 부딪힌 순간이었을 뿐이에요.";
  } else if (rule.ruleId === "rule_friction_completion_vs_time") {
    exhaustionReason =
      "정해진 시간 안에 일정을 챙겨야 하는 상황에서 같은 말을 여러 번 반복해야 할 때 엄마의 에너지 소모가 커질 수 있어요.";
    comfortMessage =
      "엄마가 조급해서가 아니라, 일정을 챙겨야 하는 현실적인 필요와 마침표가 필요한 아이의 속도가 달랐을 뿐이에요.";
  } else if (rule.ruleId === "rule_friction_observation_vs_stress") {
    exhaustionReason =
      "새로운 상황에서 아이가 겉돌지 않도록 챙겨주고 싶은 마음에 권유가 이어지면서 서로 어색한 긴장감이 생길 수 있어요.";
    comfortMessage =
      "아이가 상황을 충분히 둘러볼 수 있는 시간을 조금만 더 열어주면 서로 편안한 대화를 이어가는 데 도움이 될 수 있어요.";
  } else if (rule.ruleId === "rule_friction_emotion_vs_explanation") {
    exhaustionReason =
      "아이를 달래고 납득시키려 차근차근 설명했는데도 아이가 받아들이지 못하면 대화의 피로감이 크게 느껴질 수 있어요.";
    comfortMessage =
      "설명이 부족했던 것이 아니라, 속상한 감정이 가라앉을 작은 틈이 먼저 필요했던 타이밍의 차이였어요.";
  } else if (rule.ruleId === "rule_friction_autonomy_vs_firmness") {
    exhaustionReason =
      "매일 지켜야 하는 일상 규칙을 지도하는 과정에서 사소한 일마다 실랑이가 반복되면 매 순간 지치기 쉬워요.";
    comfortMessage =
      "큰 규칙의 테두리 안에서 아이가 직접 고를 수 있는 작은 틈을 열어주면 부딪힘을 줄이는 데 도움이 될 수 있어요.";
  } else {
    exhaustionReason =
      "반복되는 실랑이 속에서 같은 대처를 이어가느라 힘이 부치는 순간이 있었을 것입니다.";
    comfortMessage =
      "서로가 상황을 마주하는 기본 호흡이 달랐던 만큼, 속도를 맞추는 작은 조율이 도움이 될 수 있습니다.";
  }

  const ch5Claims: SentenceClaim[] = [
    {
      claimId: "ch5_c1",
      claimType: isCollaborative ? "OBSERVED" : "INFERRED",
      chapter: 5,
      text: exhaustionReason,
      evidenceRefs: refs,
      inferenceLevel: isCollaborative ? "direct" : "low",
    },
    {
      claimId: "ch5_c2",
      claimType: "EMOTIONAL_COPY",
      chapter: 5,
      text: comfortMessage,
      evidenceRefs: refs,
      inferenceLevel: "reflective",
    },
  ];
  allSentenceClaims.push(...ch5Claims);

  // ── Chapter 08: Core Promise Anchor ──
  const ch8Claims: SentenceClaim[] = [
    {
      claimId: "ch8_c1",
      claimType: "RECOMMENDATION",
      chapter: 8,
      text: rule.anchorPromise,
      evidenceRefs: refs,
      inferenceLevel: "direct",
    },
  ];
  allSentenceClaims.push(...ch8Claims);

  // ── Fortune Reflection (Reflective Layer) ──
  let fortuneReflection: SignatureReport["fortuneReflection"] = undefined;
  if (childFortune) {
    const el = childFortune.dayMasterElement;
    const allPatterns = childEvidences.map((e) => e.observedPattern);
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
        hintText = `${childName}의 출생정보에서는 자기 방식으로 움직이려는 쪽의 힌트가 있었어요. 실제 결과는 엄마가 알려준 행동을 중심으로 정리했어요.`;
      } else if (el === "fire" && isPraiseObs) {
        hintText = `${childName}의 출생정보에서는 에너지를 활발하게 드러내려는 쪽의 힌트가 있었어요. 실제 결과는 엄마가 알려준 행동을 중심으로 정리했어요.`;
      } else if (el === "metal" && isStructuredObs) {
        hintText = `${childName}의 출생정보에서는 자기 기준이나 마침표를 챙기려는 쪽의 힌트가 있었어요. 실제 결과는 엄마가 알려준 행동을 중심으로 정리했어요.`;
      } else {
        hintText = `${childName}의 출생정보에서는 상황을 천천히 살피려는 쪽의 힌트가 있었어요. 실제 결과는 엄마가 알려준 행동을 중심으로 정리했어요.`;
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
        intention: momIntention,
        possibleFeeling: "아이를 바르게 챙겨주고 싶은 책임감",
      },
      childPerspective: {
        possibleInterpretation: childInterpretation,
        possibleFeeling: "자신의 속도나 감정이 존중받고 싶은 마음",
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
      title: isCollaborative ? "평소 서로가 맞물리는 대화 흐름 (Collaboration Flow)" : "5단계 갈등 흐름 (Conflict Chain)",
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
      oneSentenceAnchor: rule.anchorPromise,
      meaning: "갈등의 순간에도 서로의 기본 결을 기억하면, 일상의 대화가 훨씬 편안해질 수 있어요.",
      evidenceRefs: refs,
      sentenceClaims: ch8Claims,
    },
    fortuneReflection,
    fortuneRelationship,
    allSentenceClaims,
  };
}
