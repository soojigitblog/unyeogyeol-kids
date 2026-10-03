// P3.5 감정/학습 사용설명서 — 고정 상황/축 라벨. AI는 이 라벨을 만들지 않는다.

export const EMOTION_SITUATION_LABEL: Record<string, string> = {
  em_angry: "화날 때",
  em_upset: "속상할 때",
  em_anxious: "불안할 때",
  em_unfamiliar: "낯설 때",
  em_failure: "실패했을 때",
  em_jealous: "질투할 때",
  em_embarrassed: "부끄러울 때",
};

/** 현재 설문에 직접적인 근거가 있는 상황(없으면 항상 groundedInGeneric 처리). */
export const EMOTION_SITUATION_HAS_EVIDENCE: Record<string, boolean> = {
  em_angry: true,
  em_upset: true,
  em_anxious: false,
  em_unfamiliar: true,
  em_failure: true,
  em_jealous: false,
  em_embarrassed: false,
};

export const LEARNING_AXIS_LABEL: Record<string, string> = {
  la_explain_vs_experience: "설명형 · 체험형",
  la_immersion_vs_repetition: "몰입형 · 반복형",
  la_alone_vs_together: "혼자 · 함께",
  la_competition_vs_self: "경쟁동기 · 자기성취동기",
  la_praise_goal_choice: "칭찬 · 목표 · 선택권",
  la_visual_verbal_kinesthetic: "시각 · 언어 · 행동",
  la_immediate_vs_longterm: "즉각 보상 · 장기 목표",
};

export const LEARNING_AXIS_HAS_EVIDENCE: Record<string, boolean> = {
  la_explain_vs_experience: false,
  la_immersion_vs_repetition: true,
  la_alone_vs_together: true,
  la_competition_vs_self: true,
  la_praise_goal_choice: true,
  la_visual_verbal_kinesthetic: false,
  la_immediate_vs_longterm: false,
};
