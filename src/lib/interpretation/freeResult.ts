// interpretation 모듈 (MOCK ONLY — 유료 AI 호출 없음)
//
// 신호 우선순위(LOCK):
//   1) 부모가 실제로 관찰한 아이 행동 (BehaviorEvidence)
//   2) 현재 육아 고민
//   3) deterministic 사주 facts
//
// 핵심 규칙: 사주 facts 가 관찰된 행동을 "덮어쓰지" 않는다.
//   경향이 관찰과 다르면 시스템 해설 없이 하나의 자연스러운 아이 모습으로 통합한다.
//
// 안전: 의학/발달 판단·직업/학업 단정·부모 비난 금지.
// 표현: 추상적 기질 철학 대신 실제 아이 장면을 바로 떠올릴 수 있는 사람의 말.

import type { Element, FreeResult } from "@/lib/types";
import { type AxisValues, band } from "@/lib/questionnaire/evidence";
import type { AgeBand } from "@/lib/age";

export interface FortuneSignal {
  dayMasterElement: Element;
}

/** 사주 오행이 암시하는 에너지 방향 (내부 보조 신호 — 고객 노출 금지) */
function fortuneOutwardness(el: Element): "outward" | "steady" | "precise" {
  if (el === "fire" || el === "wood") return "outward";
  if (el === "metal") return "precise";
  return "steady"; // water, earth
}

interface Keyword {
  word: string;
  weight: number;
}

function collectKeywords(ax: AxisValues): string[] {
  const pool: Keyword[] = [];
  const push = (word: string, weight: number) => pool.push({ word, weight });

  // 1. 관찰/접근 스타일
  const obs = ax.needs_observation_time;
  if (band(obs) === "high") push("호기심이많아요", 4);
  else if (band(obs) === "low") push("천천히익숙해져요", 4);

  // 2. 자기주도성
  const dir = ax.strong_self_direction;
  if (band(dir) === "high") push("내가직접해볼래요", 3.8);
  else if (band(dir) === "low") push("익숙해지면마음을열어요", 3.2);

  // 3. 놀이 몰입도
  const focus = ax.play_focus_style;
  if (band(focus) === "high") push("한번빠지면깊게", 3.5);
  else if (band(focus) === "low") push("다양하게탐색해요", 3.3);

  // 4. 활동 전환
  const trans = ax.transition_preference;
  if (band(trans) === "low") push("마무리시간이필요해요", 3.4);
  else if (band(trans) === "high") push("전환이유연해요", 2.8);

  // 5. 감정 표현
  const emo = ax.emotional_expression_intensity;
  if (band(emo) === "high") push("마음표현이풍부해요", 3.1);
  else if (band(emo) === "low") push("스스로마음을추슬러요", 2.7);

  // 6. 동기/칭찬
  const rec = ax.motivation_source;
  if (band(rec) === "high") push("칭찬에힘나요", 3.0);
  else if (band(rec) === "low") push("스스로만족해요", 2.6);

  // 7. 또래 관계
  const social = ax.social_warmup_style;
  if (band(social) === "high") push("친구에게먼저다가가요", 2.9);
  else if (band(social) === "low") push("한두명과깊게놀아요", 2.5);

  // 8. 규칙/납득
  const rule = ax.rule_negotiation_style;
  if (band(rule) === "high") push("이유를알아야움직여요", 3.0);

  const sorted = pool.sort((a, b) => b.weight - a.weight).map((k) => k.word);
  const unique = Array.from(new Set(sorted));
  const fallback = ["마음이따뜻해요", "차근차근살펴요", "자기생각이또렷해요"];
  while (unique.length < 3) {
    const f = fallback.shift();
    if (!f) break;
    if (!unique.includes(f)) unique.push(f);
  }
  return unique.slice(0, 3);
}

function buildOneSentence(
  ax: AxisValues,
  fortune: FortuneSignal | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ageBandVal: AgeBand,
): string {
  const outward = fortune ? fortuneOutwardness(fortune.dayMasterElement) : "steady";
  const obsBand = band(ax.needs_observation_time);
  const dirBand = band(ax.strong_self_direction);
  const transBand = band(ax.transition_preference);
  const emoBand = band(ax.emotional_expression_intensity);
  const focusBand = band(ax.play_focus_style);
  const ruleBand = band(ax.rule_negotiation_style);
  const recBand = band(ax.motivation_source);

  // [충돌 및 특수 조합 케이스] - 시스템 해설 없이 자연스러운 아이 행동으로 통합
  // 1. 사주는 outward(불/나무)이나 실제 관찰은 낯선 곳에서 살핌 + 감정 표현 큼
  if (outward === "outward" && (obsBand === "low" || obsBand === "mid_low") && emoBand === "high") {
    return "낯선 곳에서는 충분히 살펴보지만, 마음이 놓이거나 감정이 올라오면 자기 생각과 마음을 숨김없이 솔직하게 드러내는 아이예요.";
  }

  // 2. 사주는 outward(불/나무)이나 실제 관찰은 낯선 곳에서 살핌 (일반)
  if (outward === "outward" && (obsBand === "low" || obsBand === "mid_low")) {
    return "낯선 곳에서는 충분히 살펴보지만, 자기 기준이 생긴 뒤에는 행동과 표현이 꽤 분명해질 수 있는 아이예요.";
  }

  // 3. 사주는 steady(물/흙)이나 실제 관찰은 먼저 다가감
  if (outward === "steady" && (obsBand === "high" || obsBand === "mid_high")) {
    return "처음 보는 상황에도 호기심을 갖고 먼저 다가가 보며, 익숙해질수록 주변과 편안하게 어울리는 아이예요.";
  }

  // [주요 행동 조합 패턴들]
  // A. 자기주장 강함 + 전환 시 마무리 필요 (고집 & 집중)
  if (dirBand === "high" && transBand === "low") {
    return "하고 싶은 게 생기면 스스로 끝까지 해봐야 직성이 풀리고, 하던 활동을 멈출 땐 마음 정리할 시간이 필요한 아이예요.";
  }

  // B. 낯선 환경 충분히 관찰 + 주변과 결을 맞춤 (신중 & 조화)
  if (obsBand === "low" && dirBand === "low") {
    return "처음 만나는 장소나 사람 앞에서는 충분히 지켜보며 안전함을 확인한 뒤에, 천천히 마음을 열고 스며드는 아이예요.";
  }

  // C. 새로운 활동 빠른 접근 + 칭찬/인정에 반응 큼 (도전 & 인정)
  if (obsBand === "high" && recBand === "high") {
    return "새로운 놀이나 상황을 보면 호기심으로 먼저 다가가 부딪혀 보고, 곁에서 알아봐 주면 더 신나서 해내는 아이예요.";
  }

  // D. 규칙 이유 납득 필요 + 놀이 깊은 몰입 (원칙 & 몰입)
  if (ruleBand === "high" && focusBand === "high") {
    return "좋아하는 놀이에 한번 빠지면 끝까지 깊게 몰입하고, 자기가 납득한 방식과 약속 안에서 움직일 때 가장 편안해하는 아이예요.";
  }

  // E. 자기주장 강함 + 감정 표현 큼
  if (dirBand === "high" && emoBand === "high") {
    return "자기가 원하는 방향이 분명하고 마음에 들지 않으면 감정이 크게 올라오지만, 그만큼 표현이 솔직하고 당찬 아이예요.";
  }

  // F. 낯선 환경 관찰 필요 + 자기 페이스 유지
  if (obsBand === "low" && transBand === "low") {
    return "새로운 환경을 조심스럽게 살피며 적응하고, 자기가 시작한 일은 자기 속도에 맞춰 차근차근 끝맺는 아이예요.";
  }

  // G. 기본 균형형
  return "상황을 보며 자기 속도로 편안하게 다가가고, 좋아하는 것에 마음을 두고 즐겁게 몰입하는 아이예요.";
}

function buildMisreading(ax: AxisValues): string {
  // 1. 자기주장이 강할 때
  if (band(ax.strong_self_direction) === "high") {
    return "엄마 눈에는 고집을 부리는 것처럼 보일 수 있어요. 자기가 정한 순서나 방식이 분명한 편이라, 통제하기보다 두 가지 선택지 안에서 직접 결정하게 해 주면 갈등이 크게 줄어요.";
  }
  // 2. 활동 전환이 어려울 때
  if (band(ax.transition_preference) === "low") {
    return "‘왜 말을 바로 안 듣지?’ 싶을 수 있어요. 반항하는 게 아니라 하던 놀이에서 생각이 아직 빠져나오지 못한 상태이니, 갑자기 끊기보다 조금 전에 미리 알려주면 더 수월하게 넘어갈 수 있어요.";
  }
  // 3. 낯선 곳에서 관찰 시간이 길 때
  if (band(ax.needs_observation_time) === "low") {
    return "낯선 장소나 사람 앞에서 굳어 있으면 소심한가 걱정될 수 있어요. 상황이 안전한지 스스로 살피는 시간이 충분히 지나면 자기 페이스를 찾으니 재촉하지 않고 기다려 주는 게 좋아요.";
  }
  // 4. 감정 표현이 격할 때
  if (band(ax.emotional_expression_intensity) === "high") {
    return "감정이 올라오면 표현이 크게 나오는 편이에요. 그래서 진정하기 전에 설명을 길게 하면 말이 잘 들어오지 않을 수 있으니, 먼저 감정을 짧게 읽어주는 게 우선이에요.";
  }
  // 5. 좌절 후 회복이 느릴 때
  if (band(ax.recovery_pace) === "low") {
    return "작은 일에도 속상해하며 오래 곱씹으면 마음이 약한가 싶을 수 있어요. 잘 해내고 싶었던 마음이 컸던 것이니, ‘괜찮아 별거 아냐’ 대신 속상했던 마음부터 먼저 알아주면 더 빨리 털어내요.";
  }
  // 6. 새로운 곳에 덥석 다가갈 때
  if (band(ax.needs_observation_time) === "high") {
    return "잠시도 가만히 있지 않아 산만하게 느껴질 수 있어요. 머리로 생각하기보다 몸으로 직접 부딪치며 배우는 스타일이라, 위험하지 않은 선에서 직접 해볼 여지를 주는 편이 더 잘 맞을 수 있어요.";
  }
  return "아이의 행동이 불쑥 이해되지 않을 때가 있지만, 고치려 하기보다 아이가 세상을 대하는 고유한 속도를 인정해 주는 것부터 시작해 보세요.";
}

interface PhrasePair {
  before: string;
  after: string;
}

function buildPhrasePair(ax: AxisValues): PhrasePair {
  // A. 자기주장 강함 -> 선택권 제공
  if (band(ax.strong_self_direction) === "high") {
    return {
      before: "빨리 신발 신어!",
      after: "파란 신발이랑 흰 신발 중에 어떤 거 먼저 신어볼래?",
    };
  }
  // D. 전환 어려움 / 몰입 -> 전환 예고
  if (band(ax.transition_preference) === "low") {
    return {
      before: "그만하고 이제 가자!",
      after: "자동차 주차 딱 한 번만 더 하고, 시계 바늘이 여기 오면 출발하자.",
    };
  }
  // B. 낯선 환경 관찰 -> 대기 / 안전 기지
  if (band(ax.needs_observation_time) === "low") {
    return {
      before: "빨리 가서 친구들이랑 인사해!",
      after: "엄마 손 잡고 여기서 조금 구경하다가, 들어가고 싶을 때 가보자.",
    };
  }
  // C. 칭찬 반응 높음 -> 구체적 과정 인정
  if (band(ax.motivation_source) === "high") {
    return {
      before: "어~ 잘했네.",
      after: "이거 혼자 해보려고 끝까지 애썼네! 엄마가 다 봤어.",
    };
  }
  // E. 감정 표현 큼 -> 감정 수용 후 호흡
  if (band(ax.emotional_expression_intensity) === "high") {
    return {
      before: "뚝! 그만 울어.",
      after: "많이 속상하고 화났구나. 숨 한번 고르고 엄마한테 이야기해 줄래?",
    };
  }
  return {
    before: "왜 자꾸 그래!",
    after: "네 마음은 이런 거였구나. 엄마한테 천천히 알려줄래?",
  };
}

export interface FreeResultInput {
  axes: AxisValues;
  fortune: FortuneSignal | null;
  ageBand: AgeBand;
}

export function generateFreeResult(input: FreeResultInput): FreeResult {
  const { axes, fortune, ageBand: ageBandVal } = input;
  const oneSentence = buildOneSentence(axes, fortune, ageBandVal);
  const phrase = buildPhrasePair(axes);

  return {
    oneSentence,
    keywords: collectKeywords(axes),
    misreading: buildMisreading(axes),
    phraseBefore: phrase.before,
    phraseAfter: phrase.after,
  };
}
