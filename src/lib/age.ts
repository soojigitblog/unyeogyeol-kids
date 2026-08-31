// child-profile 모듈: 나이 계산
// FINAL LOCK: birthDate 를 source of truth 로 사용하고 현재 날짜 기준으로 계산.

export interface AgeInfo {
  ageInMonths: number;
  years: number;
  months: number;
  /** 예: "만 3세 4개월" */
  ageDisplay: string;
  /** 2~7세 타깃 범위 여부 (참고용, 차단하지 않음) */
  inTargetRange: boolean;
}

function parseDate(birthDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(mo) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

export function computeAge(birthDate: string, now: Date = new Date()): AgeInfo | null {
  const birth = parseDate(birthDate);
  if (!birth) return null;
  if (birth.getTime() > now.getTime()) return null;

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  // 아직 이번 달의 생일(일자)이 지나지 않았으면 한 달 차감
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const ageDisplay =
    remMonths === 0 ? `만 ${years}세` : `만 ${years}세 ${remMonths}개월`;

  return {
    ageInMonths: months,
    years,
    months: remMonths,
    ageDisplay,
    inTargetRange: months >= 24 && months <= 95, // 만 2세 ~ 만 7세 11개월
  };
}

// age-aware copy 를 위한 구간. 발달 수준을 "판정"하지 않고 표현 수위만 조정한다.
export type AgeBand =
  | "under_toddler" // 만 2세 미만 (참고)
  | "toddler" // 만 2~3세
  | "preschool" // 만 4~5세
  | "kindergarten" // 만 6~7세
  | "over_kindergarten"; // 만 8세 이상 (참고)

export function ageBand(ageInMonths: number): AgeBand {
  if (ageInMonths < 24) return "under_toddler";
  if (ageInMonths <= 47) return "toddler";
  if (ageInMonths <= 71) return "preschool";
  if (ageInMonths <= 95) return "kindergarten";
  return "over_kindergarten";
}

/** 구간별로 부모가 자주 마주치는 일상 맥락(예시 문구용). */
export const AGE_CONTEXT: Record<
  AgeBand,
  { scene: string; focus: string }
> = {
  under_toddler: { scene: "일상 속 작은 전환", focus: "안정감과 선택권" },
  toddler: { scene: "떼쓰기와 일상 전환", focus: "선택권과 놀이" },
  preschool: { scene: "규칙과 또래 놀이", focus: "역할놀이와 자기표현" },
  kindergarten: { scene: "집단생활과 친구관계", focus: "자기주도와 과제 시작" },
  over_kindergarten: { scene: "학교생활과 친구관계", focus: "자기주도와 책임" },
};
