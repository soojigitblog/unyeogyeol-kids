// feedbackSchema 모듈: 익명/동의 기반 사용자 반응 피드백 스키마 (데이터 수집용 스키마 정의만, DB/analytics 연동 없음)

export type ResultResonance =
  | "VERY_SIMILAR"
  | "SOMEWHAT_SIMILAR"
  | "NOT_SURE"
  | "NOT_SIMILAR";

export type HelpfulnessRating =
  | "HELPFUL"
  | "NEUTRAL"
  | "NOT_HELPFUL";

export interface UserFeedbackPayload {
  feedbackId: string;
  reportId?: string;
  timestamp: string;
  isConsented: boolean; // 동의 기반
  resultResonance: ResultResonance;
  helpfulness: HelpfulnessRating;
  mostHelpfulBlock?: string;
  leastHelpfulBlock?: string;
  parentComment?: string;
}
