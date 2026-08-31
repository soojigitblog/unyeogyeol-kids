// age-band 정의: 3개 연령대 구간
// Age Band A: 24~35개월 (toddler_early)
// Age Band B: 36~59개월 (preschool_core)
// Age Band C: 60~95개월 (kindergarten_school)

export type AgeBandCode = "A" | "B" | "C";

export function getAgeBandCode(ageInMonths: number): AgeBandCode {
  if (ageInMonths < 36) return "A";
  if (ageInMonths < 60) return "B";
  return "C";
}
