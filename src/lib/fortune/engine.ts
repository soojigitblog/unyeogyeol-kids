// fortune-engine 모듈 (deterministic FACT PROVIDER)
//
// 역할: 검증 가능한 사주 "사실"만 제공한다. 예언/미래시기/대운·세운/
//       직업·학업·발달 예측/성격 단정은 하지 않는다.
//
// 검증 범위:
//  - 일주(日柱): JDN 기반으로 계산하며, 권위 있는 만세력 fixture 로 검증됨
//    (2000-01-01=戊午, 2000-01-02=己未, 2000-01-03=庚申, 2000-02-04=壬辰).
//    공식: stemIndex=(JDN+9)%10, branchIndex=(JDN+1)%12.
//  - 시주(時柱): 출생시간을 알 때만. 시두법(五鼠遁)으로 시간(時) 천간을 정한다.
//  - 십신(十神): 일간 대비 시간 천간의 관계(시간을 알 때만).
//
// UNKNOWN 처리:
//  - 연주/월주는 절기(節氣) 경계 데이터가 필요하므로 P1에서는 계산하지 않는다.
//  - 출생시간 미상이면 시주·시간 십신은 null.
//
// 단순화(명시): 일주는 자정(00:00) 기준 civil date 로 계산한다. 야자시(23:00~)
//   경계나 진태양시 보정은 P1 범위 밖이며, KIDS 서비스에서 사주는 보조 신호다.

import type { Element, FortuneFacts, Pillar, TenGod } from "@/lib/types";

const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

const STEM_ELEMENT: Element[] = [
  "wood", // 甲
  "wood", // 乙
  "fire", // 丙
  "fire", // 丁
  "earth", // 戊
  "earth", // 己
  "metal", // 庚
  "metal", // 辛
  "water", // 壬
  "water", // 癸
];

const BRANCH_ELEMENT: Element[] = [
  "water", // 子
  "earth", // 丑
  "wood", // 寅
  "wood", // 卯
  "earth", // 辰
  "fire", // 巳
  "fire", // 午
  "earth", // 未
  "metal", // 申
  "metal", // 酉
  "earth", // 戌
  "water", // 亥
];

/** 그레고리력 -> 율리우스 적일(Julian Day Number, 정오 기준). */
export function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** 일주(일간·일지) 계산. fixture 로 검증된 공식 사용. */
export function computeDayPillar(
  year: number,
  month: number,
  day: number,
): Pillar {
  const jdn = toJDN(year, month, day);
  const stemIndex = mod(jdn + 9, 10);
  const branchIndex = mod(jdn + 1, 12);
  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    stemElement: STEM_ELEMENT[stemIndex],
    branchElement: BRANCH_ELEMENT[branchIndex],
  };
}

/** 시(時)를 지지 인덱스로. 子시=23:00~00:59. */
export function hourToBranchIndex(hour: number): number {
  // 23,0 -> 子(0); 1,2 -> 丑(1); 3,4 -> 寅(2); ...
  return mod(Math.floor((hour + 1) / 2), 12);
}

/** 시두법(五鼠遁): 일간 인덱스로 子시 천간 시작을 정하고 시간 천간 산출. */
export function computeHourPillar(dayStem: string, hour: number): Pillar {
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem);
  const branchIndex = hourToBranchIndex(hour);
  const startStem = mod(dayStemIndex % 5, 5) * 2; // 甲己->甲, 乙庚->丙 ...
  const stemIndex = mod(startStem + branchIndex, 10);
  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    stemElement: STEM_ELEMENT[stemIndex],
    branchElement: BRANCH_ELEMENT[branchIndex],
  };
}

const GENERATES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};
const CONTROLS: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

function isYang(stem: string): boolean {
  return HEAVENLY_STEMS.indexOf(stem) % 2 === 0;
}

/** 일간(dayStem) 대비 target 천간의 십신(十神)을 계산. */
export function computeTenGod(dayStem: string, targetStem: string): TenGod {
  const dm = STEM_ELEMENT[HEAVENLY_STEMS.indexOf(dayStem)];
  const te = STEM_ELEMENT[HEAVENLY_STEMS.indexOf(targetStem)];
  const samePolarity = isYang(dayStem) === isYang(targetStem);

  if (te === dm) return samePolarity ? "비견" : "겁재";
  if (GENERATES[dm] === te) return samePolarity ? "식신" : "상관";
  if (CONTROLS[dm] === te) return samePolarity ? "편재" : "정재";
  if (CONTROLS[te] === dm) return samePolarity ? "편관" : "정관";
  // te generates dm (인성)
  return samePolarity ? "편인" : "정인";
}

export function computeFortuneFacts(
  birthDate: string,
  birthTimeKnown: boolean,
  birthTime?: string,
): FortuneFacts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dayPillar = computeDayPillar(year, month, day);

  let hour: Pillar | null = null;
  let hourTenGod: TenGod | null = null;
  if (birthTimeKnown && birthTime && /^\d{2}:\d{2}$/.test(birthTime)) {
    const h = Number(birthTime.split(":")[0]);
    if (h >= 0 && h <= 23) {
      hour = computeHourPillar(dayPillar.stem, h);
      hourTenGod = computeTenGod(dayPillar.stem, hour.stem);
    }
  }

  return {
    day: dayPillar,
    dayMasterElement: dayPillar.stemElement,
    hour,
    hourTenGod,
    year: "unknown",
    month: "unknown",
    birthTimeKnown,
    supported: {
      dayPillar: true,
      hourPillar: hour != null,
      yearPillar: false,
      monthPillar: false,
    },
  };
}

/** 확보된 사실에서 등장하는 오행 목록(중복 포함). 무료 해석의 보조 신호. */
export function collectElements(facts: FortuneFacts): Element[] {
  const out: Element[] = [facts.day.stemElement, facts.day.branchElement];
  if (facts.hour) out.push(facts.hour.stemElement, facts.hour.branchElement);
  return out;
}

export const ELEMENT_LABEL_KO: Record<Element, string> = {
  wood: "나무",
  fire: "불",
  earth: "흙",
  metal: "쇠",
  water: "물",
};

/** 오행별 "기본 결" — 단정이 아니라 아주 가벼운 경향으로만 사용한다. */
export const ELEMENT_TENDENCY: Record<
  Element,
  { vibe: string; oneWord: string }
> = {
  wood: { vibe: "쭉쭉 뻗어 나가려는", oneWord: "성장" },
  fire: { vibe: "환하게 드러내는", oneWord: "표현" },
  earth: { vibe: "든든하게 품는", oneWord: "안정" },
  metal: { vibe: "야무지게 매듭짓는", oneWord: "단단함" },
  water: { vibe: "부드럽게 스며드는", oneWord: "유연함" },
};
