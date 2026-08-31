// conflict-scenarios 모듈: 고민별 구체적 일상 장면 정의

import type { ConcernId } from "@/lib/types";

export interface ConflictScenario {
  scenarioId: string;
  concernId: ConcernId;
  title: string;
  situationPrompt: string;
}

export const CONFLICT_SCENARIOS: ConflictScenario[] = [
  // ── 1. 식습관/편식 (meal) ─────────────────────────────
  {
    scenarioId: "sc_meal_new_food_reject",
    concernId: "meal",
    title: "처음 보는 음식을 거부할 때",
    situationPrompt: "새로운 반찬이나 낯선 냄새·모양의 음식을 보자마자 완강히 거부해요.",
  },
  {
    scenarioId: "sc_meal_picky_favorite",
    concernId: "meal",
    title: "좋아하는 것만 골라 먹을 때",
    situationPrompt: "자기가 좋아하는 특정 반찬이나 간식만 찾고 다른 밥은 안 먹으려 해요.",
  },
  {
    scenarioId: "sc_meal_cant_sit_still",
    concernId: "meal",
    title: "식탁에서 오래 앉아 있지 않을 때",
    situationPrompt: "몇 숟가락 먹지 않고 식탁에서 일어나 돌아다니거나 딴청을 피워요.",
  },
  {
    scenarioId: "sc_meal_force_refusal",
    concernId: "meal",
    title: "먹으라고 하면 더 거부할 때",
    situationPrompt: "한 입만 더 먹으라고 권하거나 숟가락을 주면 더 심하게 떼를 쓰고 밀어내요.",
  },
  {
    scenarioId: "sc_meal_start_reluctance",
    concernId: "meal",
    title: "식사 시작 자체를 싫어할 때",
    situationPrompt: "밥 먹자고 식탁에 부르면 오지 않으려 하고 도망치거나 피해요.",
  },
  {
    scenarioId: "sc_meal_etc",
    concernId: "meal",
    title: "기타 식사 및 편식 상황",
    situationPrompt: "식사 시간 전후로 밥을 먹이는 과정에서 실랑이가 자주 반복돼요.",
  },

  // ── 2. 떼쓰기 (tantrum) ───────────────────────────────
  {
    scenarioId: "sc_tantrum_frustration",
    concernId: "tantrum",
    title: "뜻대로 안 될 때 격해지는 상황",
    situationPrompt: "블록이 무너지거나 원하는 것이 안 될 때 크게 울거나 떼를 써요.",
  },
  {
    scenarioId: "sc_tantrum_limit_setting",
    concernId: "tantrum",
    title: "안 된다고 제지할 때 크게 울 때",
    situationPrompt: "위험하거나 안 되는 행동을 멈추게 하면 바닥에 드러눕거나 소리를 질러요.",
  },
  {
    scenarioId: "sc_tantrum_transition_stop",
    concernId: "tantrum",
    title: "재미있는 놀이를 멈춰야 할 때",
    situationPrompt: "놀이터나 키즈카페에서 집에 가자고 하면 격하게 울며 버텨요.",
  },

  // ── 3. 고집 (stubborn) ───────────────────────────────
  {
    scenarioId: "sc_stubborn_insistence",
    concernId: "stubborn",
    title: "자기 방식이나 순서를 고집할 때",
    situationPrompt: "꼭 자기가 원하는 방식이나 순서대로 해야 직성이 풀려요.",
  },
  {
    scenarioId: "sc_stubborn_clothes_choice",
    concernId: "stubborn",
    title: "옷이나 신발 등 특정 물건만 고집할 때",
    situationPrompt: "날씨나 상황에 안 맞아도 자기가 고른 옷이나 신발만 신겠다고 버텨요.",
  },

  // ── 4. 훈육 (discipline) ─────────────────────────────
  {
    scenarioId: "sc_discipline_instruction",
    concernId: "discipline",
    title: "외출/정리 등 해야 할 일을 거부할 때",
    situationPrompt: "외출 준비, 장난감 정리 등 해야 할 일을 시키면 강하게 싫다고 버텨요.",
  },
  {
    scenarioId: "sc_discipline_routine_hygiene",
    concernId: "discipline",
    title: "양치·목욕 등 기본 일과를 미룰 때",
    situationPrompt: "양치질이나 목욕, 손 씻기 같은 필수 일과를 매번 미루고 피하려 해요.",
  },

  // ── 5. 수면/잠자리 (sleep) ────────────────────────────
  {
    scenarioId: "sc_sleep_bedtime_delay",
    concernId: "sleep",
    title: "잠자리에 들지 않고 계속 놀려 할 때",
    situationPrompt: "졸린 상태에서도 눕지 않으려 하고 자꾸 다른 놀이를 찾으며 잠을 미뤄요.",
  },
  {
    scenarioId: "sc_sleep_night_waking",
    concernId: "sleep",
    title: "밤에 자주 깨서 엄마를 찾거나 울 때",
    situationPrompt: "자다가 깨서 울거나 엄마가 옆에 없으면 다시 잠들지 못해요.",
  },

  // ── 6. 등원/어린이집 (daycare) ─────────────────────────
  {
    scenarioId: "sc_daycare_separation",
    concernId: "daycare",
    title: "등원 시 헤어지기 힘들어할 때",
    situationPrompt: "어린이집이나 유치원 문앞에서 엄마와 떨어지지 않으려 해요.",
  },
  {
    scenarioId: "sc_daycare_morning_hurry",
    concernId: "daycare",
    title: "아침 등원 준비로 바쁠 때 늑장 부릴 때",
    situationPrompt: "등원 시간이 촉박한데 옷 입기나 밥 먹기를 느긋하게 미뤄요.",
  },

  // ── 7. 낯가림 (shyness) ──────────────────────────────
  {
    scenarioId: "sc_shyness_hesitation",
    concernId: "shyness",
    title: "낯선 사람이나 장소에서 얼어붙을 때",
    situationPrompt: "새로운 장소나 사람 앞에서 엄마 뒤로 숨고 말 한마디 안 하려 해요.",
  },
  {
    scenarioId: "sc_shyness_slow_entry",
    concernId: "shyness",
    title: "단체 활동에 바로 참여하지 못할 때",
    situationPrompt: "또래들이 모여 노는 곳에 바로 들어가지 못하고 한참을 지켜봐요.",
  },

  // ── 8. 친구관계 (friends) ────────────────────────────
  {
    scenarioId: "sc_friends_sharing",
    concernId: "friends",
    title: "친구와의 놀이에서 갈등이 생길 때",
    situationPrompt: "친구와 장난감을 나누지 못하거나 자기 순서에 예민하게 반응해요.",
  },

  // ── 9. 형제/자매 (sibling) ───────────────────────────
  {
    scenarioId: "sc_sibling_rivalry",
    concernId: "sibling",
    title: "형제/자매와 계속 다툴 때",
    situationPrompt: "장난감이나 엄마 관심을 두고 형제/자매와 끊임없이 부딪혀요.",
  },

  // ── 10. 엄마에게만 심함 (only_with_mom) ───────────────
  {
    scenarioId: "sc_only_mom_clingy",
    concernId: "only_with_mom",
    title: "다른 사람과 있을 때는 괜찮은데 엄마에게만 떼쓸 때",
    situationPrompt: "아빠나 선생님과는 순한데 엄마만 보면 모든 감정을 폭발시키고 매달려요.",
  },

  // ── 11. 집중/놀이 (focus_play) ────────────────────────
  {
    scenarioId: "sc_focus_play_interruption",
    concernId: "focus_play",
    title: "놀이에 몰입해 부르는 소리를 못 들을 때",
    situationPrompt: "자기가 빠져 있는 놀이에서 다른 일로 전환하기를 몹시 힘들어해요.",
  },

  // ── 12. 배움/공부 (learning) ──────────────────────────
  {
    scenarioId: "sc_learning_frustration",
    concernId: "learning",
    title: "책 읽기나 학습 활동 중 뜻대로 안 되면 포기할 때",
    situationPrompt: "조금만 어렵거나 틀리면 금방 실증을 내고 회피하려 해요.",
  },

  // ── 13. 기타 (etc) ───────────────────────────────────
  {
    scenarioId: "sc_etc_daily_friction",
    concernId: "etc",
    title: "일상 속 크고 작은 실랑이",
    situationPrompt: "특정 일과나 지시 상황에서 아이와 대화의 호흡이 자주 엇갈려요.",
  },
];
