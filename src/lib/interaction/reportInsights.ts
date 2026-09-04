// reportInsights 모듈 (P2.5 PAID REPORT CONTENT DENSITY REWRITE)
//
// 목적:
//   유료 리포트의 값어치는 "고객이 입력한 사실"을 다시 읽어주는 데서 나오지 않는다.
//   입력들(장면 / 아이 첫 반응 / 보호자 첫 반응 / 그다음 결과)을 연결해야 비로소 보이는
//   구조 = MECHANISM 을 만든다.
//
// 절대 금지 (P2.4 CONTENT INTEGRITY GATE 승계):
//   - 심리 진단, 아이의 속마음, 보호자의 숨은 의도 창작
//   - 입력에 없는 대사/행동 창작
//   - 효과 보장("~하면 좋아집니다")
//
// 허용 (여기서 새 가치가 나온다):
//   - 입력된 행동/발화/결과의 "순서"와 "반복 구조"에 대한 서술
//   - 4단계 Chain 중 보호자가 실제로 통제 가능한 칸이 어디인지에 대한 구조 분석
//   - 처음 목표와 마지막에 남은 결과의 대비
//
// 재진술 금지 원칙:
//   이 모듈은 고객 입력 원문을 그대로 다시 인용하지 않는다.
//   입력을 "분류(classify)"한 뒤 분류 언어로 서술한다. 그래야 같은 문장이
//   리포트 안에서 3회 이상 반복되는 문제가 생기지 않는다.

import { obj, subj, topic } from "@/lib/caregiver";

// ── 입력 분류 타입 ────────────────────────────────────────
export type CaregiverMove = "urge" | "instruct" | "explain" | "offer" | "wait";
export type ChildMove = "continue" | "refuse" | "delay" | "emotion" | "withdraw";
export type EscalationShape =
  | "prolonged"
  | "delay"
  | "refusal_grows"
  | "emotion_up"
  | "settled";

export interface ReportInsights {
  /** SECTION 3-1: 처음 목표와 마지막에 남은 것의 대비 */
  focusShift: string;
  /** SECTION 3-2: 흐름이 길어지기 시작하는 지점 */
  escalationPoint: string;
  /** SECTION 3-3: 4칸 중 실제로 바꿀 수 있는 칸 */
  smallestLever: string;
  /** SECTION 4: 왜 하필 이 지점인가 */
  breakPointWhy: string;
  /**
   * SECTION 1: 두 사람이 엇갈리는 지점 한 문장.
   * 장면 원문을 다시 인용하지 않고 "움직이는 방향의 대비"로만 서술한다
   * (장면 전문은 SECTION 2에서 딱 한 번만 나온다).
   */
  crossingPoint: string;
  /**
   * SECTION 4 흐름도용 짧은 구조 라벨.
   * P2.5 §3: 장면 전문은 SECTION 2 에서 한 번만 나온다. 흐름도는 같은 문장을 다시
   * 복사하는 곳이 아니라 "어느 칸에서 무슨 종류의 움직임이 일어나는가"를 보여주는 곳이다.
   */
  chain: {
    childStep: string;
    caregiverStep: string;
    resultStep: string;
  };
  /**
   * 매칭되는 InteractionRule 이 없어 fallback 으로 떨어졌을 때 쓰는 대체 문구.
   * fallback 규칙의 원래 문구("상황에 맞는 최선의 방식을 찾아가는 과정이에요",
   * "한 걸음 물러서서 관찰하기")는 아무 내용이 없는 범용 문장이라 유료 리포트에
   * 그대로 나가면 안 된다(§9 §10). 실제 분류된 행동으로 대체한다.
   */
  fallbackCopy: {
    childSummary: string;
    caregiverSummary: string;
    breakActionTitle: string;
    breakActionDetail: string;
  };
  /** QA/추적용 (고객 화면 미노출) */
  trace: {
    caregiverMove: CaregiverMove;
    childMove: ChildMove;
    escalationShape: EscalationShape;
    goalKey: string;
  };
}

// ── Concern 별 "이 장면의 원래 목표" ──────────────────────
// 고객이 고른 concernId 에서만 파생한다. 없는 고민을 지어내지 않는다.
const CONCERN_GOAL: Record<string, { full: string; short: string }> = {
  sleep: { full: "잠자리로 넘어가기", short: "잠자리" },
  meal: { full: "밥을 먹고 식사를 마치기", short: "식사" },
  discipline: { full: "해야 할 일을 하기", short: "해야 할 일" },
  tantrum: { full: "올라온 감정을 가라앉히기", short: "진정" },
  stubborn: { full: "다음 순서로 넘어가기", short: "전환" },
  daycare: { full: "등원 준비를 끝내기", short: "등원 준비" },
  shyness: { full: "새로운 자리에 들어가기", short: "참여" },
  friends: { full: "친구와의 놀이를 이어가기", short: "또래 놀이" },
  sibling: { full: "형제/자매와의 다툼을 정리하기", short: "다툼 정리" },
  only_with_mom: { full: "상황을 정리하기", short: "정리" },
  focus_play: { full: "다음 일로 넘어가기", short: "전환" },
  learning: { full: "하던 활동을 이어가기", short: "활동" },
  etc: { full: "상황을 정리하기", short: "정리" },
};

// ── 분류 언어 (원문 재인용 대신 이 라벨을 쓴다) ───────────
const CAREGIVER_MOVE_LABEL: Record<CaregiverMove, string> = {
  urge: "속도를 올려 재촉하는",
  instruct: "해야 할 일을 분명히 알려주는",
  explain: "이유를 설명하는",
  offer: "직접 건네주거나 도와주는",
  wait: "말을 줄이고 기다려주는",
};

const CHILD_MOVE_LABEL: Record<ChildMove, string> = {
  continue: "하던 것을 이어가는",
  refuse: "요구를 분명히 거부하는",
  delay: "행동을 뒤로 미루는",
  emotion: "감정을 크게 드러내는",
  withdraw: "뒤로 물러서는",
};

// 흐름도(SECTION 4) 전용 짧은 서술형. 장면 원문을 다시 쓰지 않기 위한 라벨.
const CHILD_MOVE_SHORT: Record<ChildMove, string> = {
  continue: "하던 것을 이어감",
  refuse: "요구를 분명히 거부함",
  delay: "행동을 뒤로 미룸",
  emotion: "감정을 크게 드러냄",
  withdraw: "뒤로 물러섬",
};

const CAREGIVER_MOVE_SHORT: Record<CaregiverMove, string> = {
  urge: "속도를 올려 재촉함",
  instruct: "해야 할 일을 분명히 알려줌",
  explain: "이유를 설명함",
  offer: "직접 건네주거나 도와줌",
  wait: "말을 줄이고 기다림",
};

const ESCALATION_SHORT: Record<EscalationShape, string> = {
  prolonged: "주고받는 말이 길어짐",
  delay: "행동이 계속 뒤로 밀림",
  refusal_grows: "거부가 처음보다 더 뚜렷해짐",
  emotion_up: "감정 표현이 더 커짐",
  settled: "상황이 정리됨",
};

// fallback 시 "가장 먼저 바꿔볼 한 지점"의 실제 내용.
// 보호자가 3번 칸에서 무엇을 했는지(분류)에 따라 구체적 행동으로 준다.
// 3번 칸에서 보호자가 실제로 전달한 것이 무엇인지 — 장면마다 다르다.
// "멈추라"로 뭉뚱그리면 권유(식사)·설명 장면에서 사실과 어긋난다.
const DEMAND_BY_MOVE: Record<CaregiverMove, string> = {
  urge: "‘지금 바로 하라’",
  instruct: "‘멈추고 이걸 하라’",
  explain: "‘이해하고 따르라’",
  offer: "‘한 번 더 하라’",
  wait: "‘스스로 할 때까지 기다린다’",
};

// 같은 자리에서 대신 열어줄 수 있는 선택지.
const ALTERNATIVE_BY_MOVE: Record<CaregiverMove, string> = {
  urge: "‘어디까지 하고 넘어갈까’처럼 끝 지점을 고르게 하는",
  instruct: "‘어디까지 하고 넘어갈까’처럼 끝 지점을 고르게 하는",
  explain: "‘지금 할 행동 하나만 고르자’처럼 범위를 좁혀주는",
  offer: "‘이제 그만 먹을까?’처럼 아이가 끝을 정하게 하는",
  wait: "‘다음은 이거야’처럼 다음 순서를 미리 알려주는",
};

// fallback 시 아이 쪽 요약을 실제 반응 유형에 맞춰 서술한다.
const CHILD_SUMMARY_TAIL: Record<ChildMove, string> = {
  continue: "그 순간 하고 있던 것과 요구가 겹치는 자리에서 나타나는 반응이에요.",
  refuse: "권유를 받은 뒤 거부가 더 분명해지는 형태로 나타나요.",
  delay: "거부한다기보다 시작 시점을 뒤로 미루는 형태로 나타나요.",
  emotion: "말보다 감정 표현이 먼저 나오는 형태로 나타나요.",
  withdraw: "반대한다기보다 한 발 물러서서 지켜보는 형태로 나타나요.",
};

const BREAK_DETAIL_BY_MOVE: Record<CaregiverMove, string> = {
  urge: "재촉을 한 번 더 하기 전에, 지금 하던 것의 마지막 지점을 먼저 정해주세요. 요구를 없애는 게 아니라 순서만 바꾸는 거예요.",
  instruct:
    "같은 지시를 다시 말하기 전에, 무엇을 몇 개 더 하고 넘어갈지 먼저 정해주세요. 지시 내용은 그대로 두고 끝 지점만 눈에 보이게 만드는 거예요.",
  explain:
    "설명을 더 보태기 전에, 지금 할 행동 하나만 짧게 정해주세요. 이해시키는 단계와 움직이는 단계를 한꺼번에 요구하지 않는 거예요.",
  offer:
    "한 번 더 권하기 전에, 아이가 그만하겠다는 신호를 이미 보냈는지 먼저 확인해주세요. 권유 횟수를 한 번으로 미리 정해두는 거예요.",
  wait: "기다리는 동안 다음 순서를 한 문장으로 미리 알려주세요. 기다림의 끝이 언제인지 보이게 하는 거예요.",
};

const ESCALATION_LABEL: Record<EscalationShape, string> = {
  prolonged: "주고받는 말이 길어지는 상태",
  delay: "행동이 계속 뒤로 밀리는 상태",
  refusal_grows: "거부가 처음보다 더 뚜렷해지는 상태",
  emotion_up: "감정 표현이 더 커지는 상태",
  settled: "상황이 정리되는 상태",
};

// P2.6 ROUND 3: escalationPoint의 마무리 문장이 escalationShape와 무관하게
// 세 리포트 모두 동일한 고정 문장이었던 문제(Template-only Mechanism)를 없애기 위해,
// 실제 분류된 escalationShape에 따라 마무리 문장 자체가 달라지게 한다.
const ESCALATION_TAIL: Record<EscalationShape, string> = {
  prolonged:
    "이번처럼 주고받는 말이 길어지는 흐름에서는, 실랑이의 길이가 처음 반응 자체보다 그 이후 이어지는 시간에서 만들어진다는 것이 확인돼요.",
  delay:
    "이번처럼 행동이 계속 뒤로 밀리는 흐름에서는, 지연이 길어지는 지점이 처음 반응 자체보다 그 이후 이어지는 시간에 있다는 것이 확인돼요.",
  refusal_grows:
    "이번처럼 거부가 점점 뚜렷해지는 흐름에서는, 거부가 강해지는 지점이 처음 거부 자체보다 그 이후 이어지는 시간에 있다는 것이 확인돼요.",
  emotion_up:
    "이번처럼 감정 표현이 커지는 흐름에서는, 감정이 커지는 지점이 처음 반응 자체보다 그 이후 이어지는 시간에 있다는 것이 확인돼요.",
  settled: "",
};

// 고객이 직접 입력한 "최근 빈도"(recentFrequency)를 SECTION 3 근거로 쓴다.
// concern/이름만 바뀐 동일 템플릿이 되지 않도록, 실제로 입력된 반복 빈도에 따라
// "왜 지금 이 지점을 바꾸는 게 유리한가"의 근거 문장이 달라지게 한다.
const FREQUENCY_INTRO: Record<string, string> = {
  daily: "알려주신 대로 이 흐름이 거의 매일 반복된다면, 3번 문장 하나를 바꾸는 시도를 하루에도 여러 번 해볼 수 있어요. ",
  several_times_a_week: "알려주신 대로 이 흐름이 일주일에 여러 번 반복된다면, 다음번 반복 때 바로 3번 문장을 바꿔서 시도해볼 수 있어요. ",
  weekly: "알려주신 대로 이 흐름이 일주일에 한 번 정도라면, 다음에 같은 장면이 오기 전에 3번 문장을 미리 정해두는 것만으로 준비가 돼요. ",
  occasional: "알려주신 대로 이 흐름이 가끔 나타난다면, 매번 같은 방식을 고집하기보다 다음에 나타날 때 3번 문장만 새로 정해보면 돼요. ",
};

// ── 분류기 ────────────────────────────────────────────────
export function classifyCaregiverMove(
  momReact: string,
  typicalPhrase?: string
): CaregiverMove {
  const t = `${momReact ?? ""} ${typicalPhrase ?? ""}`;
  if (/재촉|빨리|서둘|어서|얼른/.test(t)) return "urge";
  if (/기다|지켜보|맡기|두고 봄|말을 줄/.test(t)) return "wait";
  if (/설명|이유|알려주려|납득|타이르/.test(t)) return "explain";
  if (/건넴|건네|권하|권유|먹여|도와/.test(t)) return "offer";
  return "instruct";
}

export function classifyChildMove(childReact: string): ChildMove {
  const t = childReact ?? "";
  if (/울|떼|소리|드러눕|폭발/.test(t)) return "emotion";
  if (/숨|뒤로|말을 안|얼어|지켜보기만/.test(t)) return "withdraw";
  // "미루다"의 활용형(미룸/미뤄/미뤘)은 받침이 "루"에 합쳐져 "미루" 부분 문자열이
  // 깨지므로 각 활용형을 명시적으로 나열한다("미룸"에는 "미루"가 들어있지 않다).
  if (/미루|미뤄|미룸|미뤘|딴청|늑장|피하|돌아다/.test(t)) return "delay";
  if (/거부|싫|안 하|밀어내|버티|완강/.test(t)) return "refuse";
  if (/이어가|계속|하던|멈추지/.test(t)) return "continue";
  return "continue";
}

export function classifyEscalation(escalation: string): EscalationShape {
  const t = escalation ?? "";
  if (/울|떼|소리|폭발|화를/.test(t)) return "emotion_up";
  if (/더 거부|더 심|완강|버티|끝까지/.test(t)) return "refusal_grows";
  if (/미루|미뤄|미룸|미뤘|딴청|늑장|안 눕|계속 놀/.test(t)) return "delay";
  if (/받아들|따라|정리되|수용|잘 넘어/.test(t)) return "settled";
  return "prolonged";
}

// ── 메인 ──────────────────────────────────────────────────
export function buildReportInsights(params: {
  childName: string;
  caregiverRoleLabel: string;
  /** 애칭이 있으면 애칭. 서술 문장에서는 이 이름을 쓴다(다른 문단들과 동일 규칙). */
  caregiverDisplayName?: string;
  concernId: string;
  childFirstReaction: string;
  momFirstReaction: string;
  momTypicalPhrase?: string;
  subsequentEscalation: string;
  /** 고객이 입력한 최근 반복 빈도. SECTION 3의 근거 문장을 이 실제 입력에 맞춘다. */
  recentFrequency?: "daily" | "several_times_a_week" | "weekly" | "occasional";
}): ReportInsights {
  const {
    childName,
    caregiverRoleLabel: cgRole,
    caregiverDisplayName,
    concernId,
    childFirstReaction,
    momFirstReaction,
    momTypicalPhrase,
    subsequentEscalation,
    recentFrequency,
  } = params;

  const caregiverMove = classifyCaregiverMove(momFirstReaction, momTypicalPhrase);
  const childMove = classifyChildMove(childFirstReaction);
  const escalationShape = classifyEscalation(subsequentEscalation);

  const goal = CONCERN_GOAL[concernId] ?? CONCERN_GOAL.etc;
  // 서술 문장은 애칭 우선(다른 문단과 동일), 흐름도 라벨은 짧은 관계명 사용.
  const cg = caregiverDisplayName?.trim() || cgRole;
  const cgSubj = subj(cg);
  const cgTopic = topic(cg);
  const childTopic = topic(childName);
  const childSubj = subj(childName);

  const cgLabel = CAREGIVER_MOVE_LABEL[caregiverMove];
  const childLabel = CHILD_MOVE_LABEL[childMove];
  const escLabel = ESCALATION_LABEL[escalationShape];

  // ── INSIGHT 1: 초점 이동 ────────────────────────────────
  // 고객이 입력한 것: 고민(목표), 마지막 결과. 입력하지 않은 것: 둘 사이의 대비 구조.
  const shiftedTopic =
    caregiverMove === "explain"
      ? "납득했느냐"
      : caregiverMove === "wait"
      ? "언제까지 기다리느냐"
      : caregiverMove === "offer"
      ? "이번에는 받아들이느냐 마느냐"
      : "지금 바로 하느냐 마느냐";

  const focusShift =
    escalationShape === "settled"
      ? `이 장면에서 ${cgTopic} '${goal.full}'를 목표로 움직였고, 알려주신 흐름은 실제로 ${escLabel}로 끝났어요. 지금은 요구와 반응이 같은 방향을 보고 있는 구간이에요.`
      : `이 장면에서 ${cgTopic} '${goal.full}'를 목표로 움직였어요. 그런데 알려주신 흐름의 마지막 칸에 남은 것은 ${goal.short}의 진행이 아니라 ${escLabel}예요. 알려주신 장면만 보면, ${cgSubj} ${cgLabel} 동안 두 사람이 실제로 주고받는 주제가 '${goal.short}'에서 '${shiftedTopic}'로 넘어가는 지점에서 이 변화가 확인돼요.`;

  // ── INSIGHT 2: 길어지기 시작하는 지점 ───────────────────
  const escalationPoint =
    escalationShape === "settled"
      ? `${childTopic} ${childLabel} 반응을 보인 뒤에도 흐름이 같은 자리로 되돌아오지 않았어요. 지금 구조에서는 첫 요구가 한 번에 마무리되고 있어요.`
      : `${childTopic} 처음 ${childLabel} 모습을 보인 순간 자체는 아직 실랑이가 아니에요. 알려주신 마지막 결과가 ${escLabel}라는 것은, 그 반응 이후에도 상황이 그대로 정리되지 않았다는 뜻이에요. 알려주신 입력에는 그 사이에 정확히 어떤 말과 행동이 오갔는지까지는 나와 있지 않지만, ${ESCALATION_TAIL[escalationShape]}`;

  // ── INSIGHT 3: 가장 작은 개입점 (구조 분석) ─────────────
  // P2.6: recentFrequency(고객이 실제로 입력한 반복 빈도)를 근거 문장 앞에 붙여,
  // concern/이름만 바뀐 동일 템플릿이 아니라 실제 입력 데이터에 따라 달라지게 한다.
  const freqIntro = recentFrequency ? FREQUENCY_INTRO[recentFrequency] ?? "" : "";
  const smallestLever = `${freqIntro}이 흐름은 네 칸으로 되어 있는데, 그중 ${cgSubj} 지금 당장 바꿀 수 있는 칸은 3번 하나예요. 1번은 이미 시작된 상황이고, 2번은 ${childName}의 반응이라 ${cgSubj} 정할 수 없고, 4번은 3번 다음에 따라오는 결과예요. 그래서 '${childSubj} 다르게 반응하도록 만드는 것'보다 '3번에서 나오는 문장 한 줄을 바꾸는 것'이 실제로 훨씬 작은 변화예요. 바꿀 대상이 아이가 아니라 문장 하나라는 게 이 리포트에서 가장 중요한 지점이에요.`;

  // ── SECTION 4: 왜 하필 3번인가 ──────────────────────────
  const breakPointWhy =
    escalationShape === "settled"
      ? `지금은 3번에서 나오는 반응이 이미 흐름을 정리하는 쪽으로 작동하고 있어요. 이 방식을 유지하는 것 자체가 이번 장면의 핵심이에요.`
      : `2번에서 ${childTopic} 이미 ${childLabel} 상태예요. 이 상태에서 3번이 ${DEMAND_BY_MOVE[caregiverMove]}는 메시지 하나로만 전달되면, 이 장면에서는 대화의 초점이 '${shiftedTopic}'에 머물기 쉬워요. 이번 흐름에서 4번이 ${escLabel}로 이어진 구간이 바로 여기예요. 3번을 ${ALTERNATIVE_BY_MOVE[caregiverMove]} 문장으로 바꾸면, 요구 자체는 그대로 두면서 선택지만 하나 늘릴 수 있어요.`;

  // ── SECTION 1: 엇갈리는 지점 한 문장 (장면 재인용 없음) ──
  const crossingPoint = `같은 순간에 ${cgSubj} ${cgLabel} 쪽으로 움직이고, ${childTopic} ${childLabel} 쪽으로 움직여요. 두 방향이 부딪히는 칸은 매번 같은 자리, ${cg}의 첫 반응이 나오는 3번이에요.`;

  return {
    focusShift,
    escalationPoint,
    smallestLever,
    breakPointWhy,
    crossingPoint,
    chain: {
      childStep: `${childName}: ${CHILD_MOVE_SHORT[childMove]}`,
      caregiverStep: `${cgRole}: ${CAREGIVER_MOVE_SHORT[caregiverMove]}`,
      resultStep: ESCALATION_SHORT[escalationShape],
    },
    fallbackCopy: {
      childSummary: `이 장면에서 ${childTopic} ${childLabel} 쪽으로 반응해요. ${CHILD_SUMMARY_TAIL[childMove]}`,
      caregiverSummary: `${cgTopic} 같은 순간에 ${cgLabel} 쪽으로 반응해요. ${obj(goal.short)} 정해진 흐름 안에서 마무리하려는 움직임이에요.`,
      breakActionTitle: `${cg}의 첫 반응에서, 같은 요구를 한 번 더 하기 전에 멈추기`,
      breakActionDetail: BREAK_DETAIL_BY_MOVE[caregiverMove],
    },
    trace: {
      caregiverMove,
      childMove,
      escalationShape,
      goalKey: concernId,
    },
  };
}
