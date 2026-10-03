// P3.5 "미래 연결 분야" — 직업 점수/순위가 아니라 정적 분야 목록. AI 관여 없음.
// "의사가 될 사주" 식 단정을 절대 하지 않는다 — "이 재능이 커지면 연결될 수 있는 세계".

import { TALENT_LABEL, type TalentId } from "./talentSeedCategories";
import type { TalentScoreResult } from "./talentSeedScoring";

const TALENT_FIELDS: Record<TalentId, string[]> = {
  talent_observation: ["의료·보건", "생명과학", "연구"],
  talent_inquiry: ["연구", "과학", "저널리즘"],
  talent_logic: ["공학", "데이터분석", "수학"],
  talent_language: ["교육", "번역·통역", "글쓰기"],
  talent_expression: ["공연·예술", "방송", "교육"],
  talent_creativity: ["디자인", "예술", "콘텐츠제작"],
  talent_spatial: ["건축", "디자인", "공학"],
  talent_physical: ["체육", "무용", "물리치료"],
  talent_empathy: ["상담", "교육", "의료·보건"],
  talent_relationship: ["교육", "서비스", "인사·조직"],
  talent_leadership: ["경영", "기획", "교육"],
  talent_independence: ["창업", "연구", "예술"],
  talent_execution: ["프로젝트관리", "제조·생산", "물류"],
  talent_immersion: ["연구", "예술", "공학"],
  talent_problem_solving: ["연구", "공학", "컨설팅"],
};

export interface FutureFieldEntry {
  field: string;
  fromTalentLabel: string;
}

/**
 * TOP5 재능의 분야 목록을 순위순으로 union·dedupe한다. 조합 키가 아니라 재능별
 * 리스트를 합치는 단순한 방식 — 15개 재능 중 5개 조합(3,003가지)을 전부 수작업으로
 * 만드는 건 비현실적이고, 이 방식으로도 "실제 TOP5 조합에 따라 달라진다"는 목적은
 * 충분히 달성된다.
 */
export function buildFutureFields(top5: TalentScoreResult[], max = 8): FutureFieldEntry[] {
  const seen = new Set<string>();
  const entries: FutureFieldEntry[] = [];
  for (const t of top5) {
    const fields = TALENT_FIELDS[t.talentId] ?? [];
    for (const field of fields) {
      if (seen.has(field)) continue;
      seen.add(field);
      entries.push({ field, fromTalentLabel: TALENT_LABEL[t.talentId] });
      if (entries.length >= max) return entries;
    }
  }
  return entries;
}

export function futureFieldSentence(entry: FutureFieldEntry): string {
  return `${entry.fromTalentLabel} 재능이 자라면 ${entry.field} 분야와 연결될 수 있어요.`;
}
