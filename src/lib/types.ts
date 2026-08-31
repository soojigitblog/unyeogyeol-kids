// 운의결 KIDS — 공통 타입 정의
// 모듈: child-profile / questionnaire / fortune-engine / behavior-evidence / interpretation / p2-interaction

export type Gender = "girl" | "boy";

/**
 * 아이 기본 프로필.
 * FINAL LOCK: currentAge 를 저장하지 않는다. birthDate 가 source of truth.
 * 나이(ageInMonths / ageDisplay)는 항상 현재 날짜 기준으로 계산한다.
 */
export interface ChildProfile {
  name?: string;
  birthDate: string; // YYYY-MM-DD
  birthTimeKnown: boolean;
  birthTime?: string; // HH:MM (birthTimeKnown 이 true 일 때)
  gender: Gender;
}

// ── Questionnaire (아이 10문항) ───────────────────────────
export type QuestionDomain =
  | "new_environment"
  | "failure"
  | "self_assertion"
  | "transition"
  | "social_approach"
  | "play_immersion"
  | "praise"
  | "rule_response"
  | "emotional_expression"
  | "parent_instruction";

export interface QuestionOption {
  id: string;
  label: string;
  /** 1~4 상황형 강도. 숫자는 UI에 노출하지 않는다. */
  value: 1 | 2 | 3 | 4;
}

export interface Question {
  id: string;
  domain: QuestionDomain;
  /** "평소 우리 아이는 어떤가요?" 톤의 상황 질문 */
  prompt: string;
  options: QuestionOption[];
}

/** domain -> 선택된 option value (1~4) */
export type Answers = Partial<Record<QuestionDomain, 1 | 2 | 3 | 4>>;

// ── Fortune engine (deterministic FACT PROVIDER) ───────────
export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export type TenGod =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

export interface Pillar {
  stem: string; // 천간
  branch: string; // 지지
  stemElement: Element;
  branchElement: Element;
}

export interface FortuneFacts {
  day: Pillar;
  dayMasterElement: Element;
  hour: Pillar | null;
  hourTenGod: TenGod | null;
  year: "unknown";
  month: "unknown";
  birthTimeKnown: boolean;
  supported: {
    dayPillar: boolean;
    hourPillar: boolean;
    yearPillar: boolean;
    monthPillar: boolean;
  };
}

// ── Child Behavior evidence (deterministic) ────────────────
export type Axis =
  | "needs_observation_time"
  | "recovery_pace"
  | "strong_self_direction"
  | "transition_preference"
  | "social_warmup_style"
  | "play_focus_style"
  | "motivation_source"
  | "rule_negotiation_style"
  | "emotional_expression_intensity"
  | "instruction_response_style";

export type Confidence = "low" | "medium" | "high";

export interface BehaviorEvidence {
  domain: QuestionDomain;
  axis: Axis;
  observedPattern: string;
  observedLabel: string;
  confidence: Confidence;
  sourceQuestionIds: string[];
}

// ── Free result (정확히 5블록까지만) ────────────────────────
export interface FreeResult {
  oneSentence: string;
  keywords: string[];
  misreading: string;
  phraseBefore: string;
  phraseAfter: string;
}

// ── Concern ────────────────────────────────────────────────
export type ConcernId =
  | "tantrum"
  | "stubborn"
  | "discipline"
  | "meal"
  | "sleep"
  | "daycare"
  | "shyness"
  | "friends"
  | "sibling"
  | "only_with_mom"
  | "focus_play"
  | "learning"
  | "etc";

// ==========================================================
// ── P2 PAID SIGNATURE / INTERACTION MODEL TYPES ───────────
// ==========================================================

// ── Caregiver Profile (P2.2V.6: 엄마 고정 구조 -> 보호자/가족 관계 일반화) ──
export type CaregiverRole =
  | "mother"
  | "father"
  | "maternal_grandmother"
  | "paternal_grandmother"
  | "maternal_grandfather"
  | "paternal_grandfather"
  | "aunt"
  | "uncle"
  | "guardian"
  | "other";

export interface CaregiverProfile {
  /** 내부 분류값. 고객 문구에는 노출하지 않는다. */
  role: CaregiverRole;
  /** 고객 문구에 그대로 쓰이는 관계명 (예: "아빠", "외할머니", "큰이모"). */
  roleLabel: string;
  /** 선택 입력 애칭/이름. 없으면 roleLabel 을 사용한다. */
  displayName?: string;
  birthDate: string; // YYYY-MM-DD
  birthTimeKnown: boolean;
  birthTime?: string; // HH:MM
}

/** 하위 호환 별칭 (기존 코드/세션의 momProfile 참조 지점용). */
export type MomProfile = CaregiverProfile;

export interface SignatureSessionInput {
  caregiverProfile: CaregiverProfile;
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput;
}

// ── Mom Mini Check (점수 없음, 범주형 option) ─────────────
export type MomDomain =
  | "time_pressure_style"
  | "emotion_coping_style"
  | "instruction_resistance_style"
  | "routine_flexibility_style"
  | "conflict_recovery_style";

export type MomAxis =
  | "urgency_pace"
  | "emotional_containment"
  | "boundary_enforcement"
  | "schedule_change_response"
  | "post_conflict_processing";

export interface MomQuestionOption {
  optionId: string;
  patternId: string;
  label: string;
}

export interface MomQuestion {
  id: string;
  domain: MomDomain;
  prompt: string;
  options: MomQuestionOption[];
}

/** momDomain -> selected optionId */
export type MomAnswers = Partial<Record<MomDomain, string>>;

export interface MomEvidence {
  domain: MomDomain;
  axis: MomAxis;
  patternId: string;
  observedLabel: string;
  confidence: "medium"; // 단일 문항이므로 high 금지, 최대 medium
  sourceQuestionId: string;
}

// ── Current Conflict Input (P2.0R Detailed Interaction Chain) ──
export interface CurrentConflictInput {
  concernId: ConcernId;
  scenarioId: string; // A. 무슨 상황인가
  childFirstReaction?: string; // B. 아이 첫 반응
  momFirstReaction?: string; // C. 나(보호자) 첫 반응
  subsequentEscalation?: string; // D. 그다음 보통 어떻게 되는가
  recentFrequency?: "daily" | "several_times_a_week" | "weekly" | "occasional"; // E. 최근 얼마나 자주 (진단/점수 계산 금지, Chain 근거용)
  momTypicalPhrase?: string;
  customNote?: string;
}

// ── Interaction Rule Types ────────────────────────────────
export type InteractionConfidence = "high" | "medium" | "low";

export interface InteractionRule {
  ruleId: string;
  title: string;
  requiredChildPatterns: string[];
  requiredMomPatterns: string[];
  applicableConcerns: (ConcernId | "all")[];
  confidence: InteractionConfidence;
  interactionType: "friction" | "collaborative" | "neutral";
  childPerspectiveSummary: string;
  momPerspectiveSummary: string;
  synthesisSummary: string;
  whereToBreakSummary: {
    targetStep: 1 | 2 | 3;
    breakActionTitle: string;
    breakActionDetail: string;
  };
  samplePhrases: {
    phraseId?: string;
    situation: string;
    before: string;
    after: string;
    whyItMayHelp: string;
    evidenceRefs?: string[];
  }[];
  sampleActions: {
    actionId?: string;
    actionTitle: string;
    actionDetail: string;
    whyItMayHelp?: string;
    evidenceRefs?: string[];
  }[];
  anchorPromise: string;
}

export interface SentenceClaim {
  claimId: string;
  claimType:
    | "DIRECT_INPUT"
    | "OBSERVED"
    | "INFERRED"
    | "REFLECTIVE"
    | "RECOMMENDATION"
    | "EMOTIONAL_COPY";
  chapter: number;
  text: string;
  evidenceRefs: string[];
  inferenceLevel: "direct" | "low" | "medium" | "reflective";
}

export interface FoodMicroCheckAnswers {
  new_food_reaction?: "immediate_try" | "brief_look_then_try" | "inspect_smell_shape" | "hesitate_or_push_away";
  preference_balance?: "favorite_only_first" | "alternate_try" | "leave_unfamiliar" | "basic_familiar_only";
  prompt_response?: "reluctant_one_bite" | "shake_head_close_mouth" | "stronger_refusal_on_prompt" | "distract_or_divert";
  meal_flow_block?: "leave_table_wander" | "put_down_spoon_divert" | "express_frustration" | "slow_down_quietly";
}

export interface ParentChildFortuneReflection {
  childHints: string[];
  momHints: string[];
  sharedThemes: string[];
  contrastingThemes: string[];
  reflectionText: string;
  observationContrastText: string;
  evidenceType: "REFLECTIVE";
}

// ── P2 Signature Report Schema (8 Chapters + Provenance) ──
export interface SignatureReport {
  meta: {
    childName: string;
    childAgeDisplay: string;
    concernLabel: string;
    /** 고객 문구용 표시명(애칭이 있으면 애칭, 없으면 관계명). */
    momName?: string;
    /** 순수 관계명(예: "아빠", "할머니", "큰이모"). 배지/제목용. */
    caregiverRoleLabel: string;
    caregiverRole: CaregiverRole;
  };

  twoPersonSummary?: {
    childKeywords: string[];
    childSummary: string;
    momKeywords: string[];
    momSummary: string;
    misalignedPoint: string;
    fortuneRelationshipHint?: string;
  };

  chapter01_recurringScene: {
    title: string;
    narrative: string;
    sceneKeywords: string[];
    evidenceRefs: string[];
    sentenceClaims?: SentenceClaim[];
  };

  chapter02_perspectiveGap: {
    momPerspective: {
      intention: string;
      possibleFeeling: string;
    };
    childPerspective: {
      possibleInterpretation: string;
      possibleFeeling: string;
    };
    evidenceRefs: string[];
    sentenceClaims?: SentenceClaim[];
  };

  chapter03_interactionPattern: {
    title: string;
    childBehaviorAspect: string;
    momReactionAspect: string;
    synthesis: string;
    evidenceRefs: string[];
    sentenceClaims?: SentenceClaim[];
  };

  chapter04_conflictChain: {
    title?: string;
    isCollaborative?: boolean;
    steps: {
      stepNumber: 1 | 2 | 3 | 4 | 5;
      stage: "trigger" | "mom_reaction" | "child_reaction" | "escalation" | "exhausted_end";
      /** "아이" / "둘 다" 또는 관계명(예: 아빠, 할머니, 큰이모). */
      actor: string;
      description: string;
    }[];
    whereToBreak: {
      targetStep: number;
      breakActionTitle: string;
      breakActionDetail: string;
    };
    evidenceRefs: string[];
    sentenceClaims?: SentenceClaim[];
  };

  chapter05_momExhaustionPoint: {
    title?: string;
    isLowFriction?: boolean;
    exhaustionReason: string;
    comfortMessage: string;
    evidenceRefs: string[];
    sentenceClaims?: SentenceClaim[];
  };

  chapter06_threePhrases: {
    phraseId?: string;
    situation: string;
    before: string;
    after: string;
    whyItMayHelp: string;
    evidenceRefs: string[];
  }[];

  chapter07_threeActions: {
    actionId?: string;
    actionTitle: string;
    actionDetail: string;
    whyItMayHelp?: string;
    evidenceRefs: string[];
  }[];

  chapter08_corePromise: {
    oneSentenceAnchor: string;
    meaning: string;
    evidenceRefs: string[];
    sentenceClaims?: SentenceClaim[];
  };

  fortuneReflection?: {
    status: "ALIGNED" | "NEUTRAL" | "CONFLICTING";
    text: string;
    evidenceRefs: string[];
  };

  fortuneRelationship?: ParentChildFortuneReflection;

  allSentenceClaims?: SentenceClaim[];
}

// ── P2 Child Deep Report Schema ───────────────────────────
export interface ChildChapter {
  chapterId: string;
  title: string;
  subTitle: string;
  howChildSeesWorld: string;
  recommendedApproach: string;
  phrasePair: {
    before: string;
    after: string;
  };
}

export interface ChildDeepReport {
  meta: {
    childName: string;
    ageDisplay: string;
  };
  overview: {
    dominantPattern: string;
    keywords: string[];
  };
  chapters: ChildChapter[];
}
