// interaction-rules 모듈: Interaction Matrix Rules 정의
//
// 원칙:
// 1. 심리/뇌과학 단정 금지 (결사항전, 안전기지, 감정뇌 닫힘 등 제거).
// 2. 숫자 임의 처방(3분, 10초) rule level 저장 금지.
// 3. Low-friction/Collaborative 룰 지원 (갈등 억지 창작 방지).
// 4. requiredChildPatterns, requiredMomPatterns, applicableConcerns, confidence 명시.
// 5. P2.2H Evidence Integrity:
//    - Sentence-level Claim Provenance
//    - 금지어: 평생의 정서적 지지대, 진정제, 안전 울타리, 깊은 무력감, 안도감을 얻음 등
//    - 허용 표현: ~방식을 시도해볼 수 있어요, ~하는 데 도움이 될 수 있어요

import type { InteractionRule } from "@/lib/types";

export const INTERACTION_RULES: InteractionRule[] = [
  // 1. Friction: 아이의 완결 욕구 vs 엄마의 시간 압박 (Family A / 민준)
  {
    ruleId: "rule_friction_completion_vs_time",
    title: "아이가 흐름을 맺으려는 순간과 {{CG의}} 시간 관리가 마주칠 때",
    requiredChildPatterns: ["needs_completion_before_transition"],
    requiredMomPatterns: [
      "fast_pace_directive",
      "time_notice_prompt",
      "opt_time_control",
      "opt_time_notify",
    ],
    applicableConcerns: ["discipline", "tantrum", "stubborn", "all"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "지금 하던 놀이나 행동의 마무리를 지어야 마음이 편안하게 정리될 수 있어요.",
    momPerspectiveSummary:
      "정해진 시간과 다음 일정에 늦지 않도록 서둘러 챙겨주고 싶은 마음이에요.",
    synthesisSummary:
      "아이는 ‘하던 일의 마침표’가 필요하고, {{CG는}} ‘일정의 시작점’이 급해져 서로의 속도가 충돌하는 양상이에요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "갑작스러운 개입 대신 마침표 지점 미리 확인하기",
      breakActionDetail:
        "재촉하기 전에 아이가 어디까지 끝내고 싶은지 눈으로 확인하고 마무리 행동을 한 가지로 좁혀주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_transition_completion",
        situation: "외출 준비 중 장난감을 만지고 있을 때",
        before: "빨리 나와, 늦었어!",
        after: "지금 만들던 거 어디까지 두고 갈까? 이것만 상자에 넣고 신발 신으러 가자.",
        whyItMayHelp:
          "아이에게 행동을 완전히 빼앗기지 않고 스스로 일단락 지을 수 있는 틈을 줄 수 있어요.",
        evidenceRefs: ["child:transition_needs_completion_before_transition"],
      },
      {
        phraseId: "phrase_transition_leaving",
        situation: "놀이 공간을 정리하고 이동해야 할 때",
        before: "이제 그만하고 정리해.",
        after: "자동차 한 번만 더 주차하고 가방 챙기러 갈까?",
        whyItMayHelp:
          "마지막 마침표를 정해주면 하던 놀이를 마무리하고 다음 순서로 넘어가는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:transition_needs_completion_before_transition"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_box_marker",
        actionTitle: "하던 놀이 보관할 마무리 상자 마련하기",
        actionDetail:
          "하던 놀이를 다 부수지 않고 그대로 보관할 작은 상자나 자리를 정해두면 정리가 한결 수월해져요.",
        whyItMayHelp:
          "하던 놀이를 그대로 둘 수 있는 자리를 만들면, 놀이를 완전히 끝내지 않고도 다음 일정으로 넘어가는 선택지를 만들 수 있어요.",
        evidenceRefs: ["child:transition_needs_completion_before_transition"],
      },
      {
        actionId: "action_step_choice",
        actionTitle: "출발 전 마지막 행동 하나만 함께 고르기",
        actionDetail:
          "외출 직전 아이에게 '어떤 것 하나만 정리하고 나갈까?' 하고 스스로 마침표를 고르게 해주세요.",
        whyItMayHelp: "아이 스스로 선택한 행동으로 전환할 수 있는 기회가 될 수 있어요.",
        evidenceRefs: ["child:transition_needs_completion_before_transition"],
      },
    ],
    anchorPromise: "하던 것을 끝낼 작은 틈을 주면, 다음 순서로 넘어가는 대화도 달라질 수 있어요.",
  },

  // 2. Friction: 아이의 긴 탐색/신중함 vs 엄마의 참여 권유 (Family B / 서연)
  {
    ruleId: "rule_friction_observation_vs_stress",
    title: "충분한 탐색이 필요한 아이와 참여를 권하는 {{CG}}",
    requiredChildPatterns: ["takes_long_to_observe", "hides_behind_parent", "observes_then_joins"],
    requiredMomPatterns: ["immediate_stress_activation", "fast_pace_directive", "opt_rec_ruminate", "opt_emo_overwhelm", "opt_time_control"],
    applicableConcerns: ["shyness", "daycare", "all"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "주변을 먼저 살피고 적응할 시간이 필요한 모습이에요.",
    momPerspectiveSummary:
      "아이가 머뭇거릴 때 빠르게 참여할 수 있도록 권유하려는 태도예요.",
    synthesisSummary:
      "{{CG의}} 빠른 권유와 아이의 신중한 탐색 속도가 겹치면서 머뭇거림이 더 길어질 수 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "참여 권유 대신 곁에서 함께 머물러주기",
      breakActionDetail:
        "아이에게 참여를 바로 권하기보다 곁에 함께 서서 주변을 둘러볼 수 있게 해주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_observation_stay_beside",
        situation: "새로운 장소나 사람 앞에서 머뭇거릴 때",
        before: "얼른 인사해야지, 왜 그래?",
        after: "조금 둘러보고 싶구나. 손잡고 천천히 보자.",
        whyItMayHelp:
          "아이가 상황을 파악할 여유를 얻어 스스로 움직일 준비를 하는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
      {
        phraseId: "phrase_observation_entry",
        situation: "활동에 바로 들어가지 못할 때",
        before: "빨리 가서 친구들이랑 놀아.",
        after: "충분히 보고 나서 들어가고 싶을 때 이야기해줘.",
        whyItMayHelp:
          "아이에게 기다려준다는 신호를 전달하여 스스로 참여 시점을 잡도록 돕는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_observer_role",
        actionTitle: "주변을 편안하게 둘러볼 틈 열어주기",
        actionDetail:
          "“저기 뭐가 있나 같이 볼까?” 하며 주변을 편안하게 둘러볼 수 있는 틈을 열어주세요.",
        whyItMayHelp: "주변을 차분하게 살펴볼 수 있는 기회가 됩니다.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
      {
        actionId: "action_small_step_nod",
        actionTitle: "아이의 작은 시도 눈맞춤으로 알아채주기",
        actionDetail:
          "아이가 스스로 한 발짝 다가섰을 때 눈을 맞추며 가볍게 고개를 끄덕여주세요.",
        whyItMayHelp: "스스로 시도하는 순간을 알아채주는 격려가 될 수 있어요.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
    ],
    anchorPromise: "아이가 상황을 충분히 둘러볼 수 있는 시간을 함께 지켜봐 주는 것부터 시작해보세요.",
  },

  // 3. Friction: 감정 표현이 큰 아이 vs 설명이 먼저 나오는 엄마 (Family C / 도윤)
  {
    ruleId: "rule_friction_emotion_vs_explanation",
    title: "감정이 먼저 올라오는 아이와 설명이 먼저 나오는 {{CG}}",
    requiredChildPatterns: ["intense_emotional_burst", "energized_by_praise", "expressive_temper"],
    requiredMomPatterns: [
      "logical_explanation_first",
      "opt_emo_explain",
    ],
    applicableConcerns: ["tantrum", "discipline", "learning", "focus_play", "all"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "속상한 감정이 일어났을 때는 상황에 대한 설명이 바로 닿기 어려울 수 있어요.",
    momPerspectiveSummary:
      "아이가 상황을 이해할 수 있도록 이유를 차근차근 설명해주려는 태도예요.",
    synthesisSummary:
      "{{CG는}} 상황의 이유를 풀어주려 하고 아이는 감정이 먼저 가라앉아야 해, 대화의 타이밍이 어긋나며 피로감이 커질 수 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "긴 설명 전 감정이 가라앉을 작은 틈 주기",
      breakActionDetail:
        "이유를 설명하기 전에 '속상했구나' 하고 아이의 기분을 짧게 알아채준 뒤 잠시 숨을 고를 시간을 주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_emotion_pause_first",
        situation: "뜻대로 안 되어 크게 속상해할 때",
        before: "울지 말고 똑바로 말해, 왜 그래?",
        after: "속상했구나. 숨 한 번 쉬고 천천히 이야기하자.",
        whyItMayHelp:
          "감정을 먼저 짧게 짚어주면 긴장을 풀고 대화를 시작하는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:praise_energized_by_praise"],
      },
      {
        phraseId: "phrase_praise_effort_recognition",
        situation: "아이가 무언가를 해내고 인정을 바랄 때",
        before: "어~ 잘했네.",
        after: "아까 안 됐는데 다시 해봤네. 끝까지 해본 거 다 봤어.",
        whyItMayHelp:
          "칭찬을 들었을 때 참여가 높아지는 모습이 관찰되었으므로, 결과만 칭찬하기보다 어떤 시도를 했는지 구체적으로 짚어주는 방식을 시도해볼 수 있어요.",
        evidenceRefs: ["child:praise_energized_by_praise"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_explanation_pause",
        actionTitle: "설명 한 템포 늦추기",
        actionDetail:
          "아이가 속상해할 때는 긴 설명을 잠시 멈추고 곁에서 한 템포 숨을 고를 시간을 주세요.",
        whyItMayHelp: "아이의 감정이 가라앉은 뒤에 {{CG의}} 설명이 전달되는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:praise_energized_by_praise"],
      },
      {
        actionId: "action_effort_point",
        actionTitle: "시도한 과정 짚어주기",
        actionDetail:
          "단순한 결과 칭찬 대신 아이가 시도한 한 가지 행동을 콕 집어 말해주세요.",
        whyItMayHelp: "과정에 대한 관심이 아이의 적극성을 북돋우는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:praise_energized_by_praise"],
      },
    ],
    anchorPromise: "설명보다 먼저, 지금 속상하다는 걸 짧게 알아채주는 것부터 시작해보세요.",
  },

  // 4. Friction: 아이의 자기주도 vs 엄마의 확고한 훈육 (Family D / 하은)
  {
    ruleId: "rule_friction_autonomy_vs_firmness",
    title: "아이의 주도성과 {{CG의}} 규칙 강조가 맞부딪힐 때",
    requiredChildPatterns: ["strong_independent_preference", "insists_on_own_way", "reason_seeking", "deep_single_focus"],
    requiredMomPatterns: ["firm_boundary_insistence", "opt_inst_firm"],
    applicableConcerns: ["stubborn", "discipline", "tantrum", "focus_play", "learning", "all"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "자신의 생각이나 선택권이 배제된다고 느끼면 더 강하게 버틸 수 있어요.",
    momPerspectiveSummary:
      "지켜야 할 규칙을 분명하게 전하려는 반응이 커지는 상황이에요.",
    synthesisSummary:
      "{{CG의}} 단호한 안내가 아이에게는 자신의 선택을 막아서는 신호처럼 받아들여져 버팀이 더 커질 수 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "지시 대신 좁혀진 두 가지 선택지 제공하기",
      breakActionDetail:
        "해야 할 큰 규칙은 유지하되, 방법이나 순서에서 아이가 직접 고를 수 있는 작은 권한을 건네주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_reason_explanation_first",
        situation: "규칙이나 할 일을 전달할 때",
        before: "그냥 하라면 해.",
        after: "왜 해야 하는지 먼저 이야기해줄게.",
        whyItMayHelp:
          "이유를 확인하려는 모습이 있었기 때문에, 먼저 이유를 짧게 알려주면 아이와 대화를 이어가는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:rule_response_reason_seeking"],
      },
      {
        phraseId: "phrase_autonomy_choice",
        situation: "양치나 옷 입기를 거부하며 버틸 때",
        before: "그만하고 빨리 해.",
        after: "양치는 해야 해. 파란 칫솔로 할까, 노란 칫솔로 할까?",
        whyItMayHelp:
          "규칙의 틀 안에서 아이가 직접 고를 수 있는 작은 권한을 건네주면 실랑이를 줄이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:self_assertion_strong_independent_preference"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_choice_two",
        actionTitle: "순서 선택권 건네기",
        actionDetail:
          "해야 할 일 두 가지(예: 양치하기, 잠옷 갈아입기) 중 어떤 것을 먼저 할지 아이에게 물어보는 방식을 시도해보세요.",
        whyItMayHelp: "스스로 선택했다는 느낌이 실랑이를 줄이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:self_assertion_strong_independent_preference"],
      },
      {
        actionId: "action_reason_one_sentence",
        actionTitle: "행동의 이유 한 문장으로 나누기",
        actionDetail:
          "지시하기 전 '우리가 지금 이걸 해야 하는 이유'를 아이 눈높이에서 짧게 알려주세요.",
        whyItMayHelp: "이유를 이해할 때 아이가 상황을 받아들이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:rule_response_reason_seeking"],
      },
    ],
    anchorPromise: "규칙의 테두리는 지키되, 그 안에서 아이가 직접 고를 수 있는 작은 틈을 열어주세요.",
  },

  // 5. Low-Friction / Collaborative: 신중한 탐색형 아이와 기다려주는 엄마 (Family E / 지호)
  {
    ruleId: "rule_collab_observation_and_patience",
    title: "아이의 신중한 탐색과 {{CG의}} 묵묵한 지지가 어우러질 때",
    requiredChildPatterns: ["takes_long_to_observe", "seeks_reassurance"],
    requiredMomPatterns: [
      "patient_pace_holding",
      "silent_emotional_presence",
      "opt_time_wait",
      "opt_emo_hold",
      "opt_inst_listen",
    ],
    applicableConcerns: ["all", "daycare"],
    confidence: "high",
    interactionType: "collaborative",
    childPerspectiveSummary:
      "새로운 환경을 충분히 살펴보고 나면 편안하게 적응해가는 모습이에요.",
    momPerspectiveSummary:
      "조금 느리더라도 아이만의 페이스가 있음을 알고 묵묵히 곁을 지켜주는 태도예요.",
    synthesisSummary:
      "아이는 새로운 환경에서 먼저 살펴보는 시간이 필요한 모습이 있었고, {{CG는}} 그 순간 속도를 올리기보다 기다리는 반응을 보였어요. 두 방식이 현재 장면에서는 큰 마찰 없이 이어지고 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "현재의 차분한 기다림과 조율 방식 이어가기",
      breakActionDetail:
        "지금처럼 아이의 속도에 맞춰 한 템포 쉬어가 주는 방식이 서로에게 편안한 호흡이 됩니다.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_observation_patience",
        situation: "새로운 활동을 시작하기 전",
        before: "천천히 해봐.",
        after: "충분히 보고 나서 하고 싶을 때 언제든 이야기해줘.",
        whyItMayHelp: "아이에게 기다려준다는 신호를 전달하여 스스로 참여하도록 돕는 데 도움이 됩니다.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_reassurance_nod",
        actionTitle: "아이의 신중한 살핌을 존중하기",
        actionDetail: "아이가 스스로 한 발짝 다가설 때까지 눈을 맞추며 곁에서 조용히 기다려주는 방식을 이어가보세요.",
        whyItMayHelp: "{{CG의}} 묵묵한 눈맞춤이 아이에게 편안한 격려가 될 수 있어요.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
      {
        actionId: "action_thank_cooperation",
        actionTitle: "차분한 준비에 고마움 표현하기",
        actionDetail: "“오늘 차분하게 준비해줘서 고마워” 하고 편안하게 마음을 나눠주세요.",
        whyItMayHelp: "서로에게 부담 없는 긍정적인 일상 대화를 이어가는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:new_environment_takes_long_to_observe"],
      },
    ],
    anchorPromise: "아이의 신중한 속도를 존중하며 곁을 지켜주는 지금의 대화 방식을 편안하게 이어가보세요.",
  },

  // 6. Collaborative: 칭찬에 힘을 얻는 아이 (Fixture C 보조)
  {
    ruleId: "rule_praise_effort_and_motivation",
    title: "아이의 성취 동기와 {{CG의}} 긍정적 격려가 맞물릴 때",
    requiredChildPatterns: ["energized_by_praise"],
    requiredMomPatterns: [
      "patient_pace_holding",
      "silent_emotional_presence",
      "focus_redirection",
      "inquiry_into_reason",
      "rapid_re_adaptation",
      "active_relational_repair",
      "natural_settling",
      "time_notice_prompt",
      "child_lead_adaptation",
      "situational_acceptance",
      "opt_time_wait",
      "opt_emo_hold",
      "opt_inst_listen",
      "opt_rout_replan",
      "opt_rec_repair",
    ],
    applicableConcerns: ["learning", "focus_play", "etc", "all"],
    confidence: "medium",
    interactionType: "collaborative",
    childPerspectiveSummary:
      "자신의 노력과 성과를 인정받을 때 더 큰 보람과 적극성을 느껴요.",
    momPerspectiveSummary:
      "아이의 성취를 격려하고 긍정적인 동기를 북돋아주고 싶은 마음이에요.",
    synthesisSummary:
      "아이가 칭찬을 통해 자신감을 얻는 만큼, 단순한 결과보다 구체적인 과정에 초점을 맞추어주는 방식을 시도해볼 수 있어요.",
    whereToBreakSummary: {
      targetStep: 1,
      breakActionTitle: "결과보다 과정과 시도 구체적으로 알아채주기",
      breakActionDetail:
        "아이가 무언가를 마쳤을 때 단순히 '잘했다'고 하기보다 '포기하지 않고 시도한 과정'을 구체적으로 짚어주는 방식을 시도해보세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_praise_effort_recognition",
        situation: "아이가 무언가를 해내고 인정을 바랄 때",
        before: "어~ 잘했네.",
        after: "아까 안 됐는데 다시 해봤네. 끝까지 해본 거 다 봤어.",
        whyItMayHelp:
          "칭찬을 들었을 때 참여가 높아지는 모습이 관찰되었으므로, 결과만 칭찬하기보다 어떤 시도를 했는지 구체적으로 짚어주는 방식을 시도해볼 수 있어요.",
        evidenceRefs: ["child:praise_energized_by_praise"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_ask_solution",
        actionTitle: "구체적인 과정 짚어 말하기",
        actionDetail: "어려웠던 부분을 어떻게 해결했는지 아이에게 물어봐주세요.",
        whyItMayHelp: "자신의 시도를 돌아보며 생각하는 힘을 기르는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:praise_energized_by_praise"],
      },
    ],
    anchorPromise: "아이의 작은 시도와 노력을 가장 먼저 발견해주는 든든한 응원자가 되어주세요.",
  },

  // 7. Collaborative: 이유와 맥락을 알고 싶은 아이 (Fixture D 보조)
  {
    ruleId: "rule_reason_seeking_and_explanation",
    title: "이유를 이해하려는 아이와 차분히 안내하는 {{CG}}",
    requiredChildPatterns: ["reason_seeking", "deep_single_focus"],
    requiredMomPatterns: [
      "patient_pace_holding",
      "silent_emotional_presence",
      "temporary_deescalation",
      "compromise_structure",
      "natural_settling",
      "child_lead_adaptation",
      "situational_acceptance",
      "opt_time_wait",
      "opt_emo_redirect",
      "opt_inst_defer",
      "opt_rout_ease",
      "opt_rec_natural",
    ],
    applicableConcerns: ["focus_play", "discipline", "learning", "etc", "all"],
    confidence: "medium",
    interactionType: "collaborative",
    childPerspectiveSummary:
      "규칙이나 행동의 이유를 이해하고 납득할 수 있을 때 상황에 적응하기가 수월해요.",
    momPerspectiveSummary:
      "아이가 상황을 파악할 수 있도록 차분하게 안내해주려는 태도예요.",
    synthesisSummary:
      "규칙이나 이유를 알고 싶어 하는 모습이 관찰되어, 지시만 하기보다 이유를 함께 알려주는 방식이 더 잘 맞을 수 있어요.",
    whereToBreakSummary: {
      targetStep: 1,
      breakActionTitle: "행동의 이유를 먼저 차근차근 설명해주기",
      breakActionDetail:
        "‘왜 지금 해야 하는지’ 아이의 눈높이에서 한 문장으로 먼저 전해주는 편이 도움이 될 수 있어요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_reason_explanation_first",
        situation: "규칙이나 할 일을 전달할 때",
        before: "그냥 하라면 해.",
        after: "왜 해야 하는지 먼저 이야기해줄게.",
        whyItMayHelp:
          "이유를 확인하려는 모습이 있었기 때문에, 먼저 이유를 짧게 알려주면 아이와 대화를 이어가는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:rule_response_reason_seeking"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_tell_reason_short",
        actionTitle: "상황의 이유 한 문장으로 나누기",
        actionDetail: "지시하기 전 '우리가 지금 이걸 해야 하는 이유'를 짧게 알려주세요.",
        whyItMayHelp: "상황을 이해하고 받아들이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:rule_response_reason_seeking"],
      },
    ],
    anchorPromise: "아이가 상황을 이해할 수 있는 따뜻한 설명으로 소통의 문을 열어주세요.",
  },

  // 8. Collaborative: 자기주장과 이유 조율형 아이 (Family I)
  {
    ruleId: "rule_assertion_and_negotiation",
    title: "의사를 분명히 표현하는 아이와 경청하는 {{CG}}",
    requiredChildPatterns: ["asserts_but_negotiates", "eases_into_group"],
    requiredMomPatterns: [
      "conditional_tradeoff",
      "inquiry_into_reason",
      "rapid_re_adaptation",
      "active_relational_repair",
      "time_notice_prompt",
      "child_lead_adaptation",
      "situational_acceptance",
      "opt_time_notify",
      "opt_emo_explain",
      "opt_inst_negotiate",
      "opt_rout_replan",
      "opt_rec_repair",
    ],
    applicableConcerns: ["friends", "stubborn", "discipline", "etc", "all"],
    confidence: "medium",
    interactionType: "collaborative",
    childPerspectiveSummary:
      "자신의 의견을 분명히 말하되 {{CG의}} 설명을 들으면 조율할 수 있는 유연함을 지니고 있어요.",
    momPerspectiveSummary:
      "아이의 생각을 경청하고 상황을 차분하게 풀어가려는 태도예요.",
    synthesisSummary:
      "아이의 의견을 먼저 충분히 들어주고 {{CG의}} 이유를 나눌 때 서로 생각을 주고받는 대화가 이어질 수 있어요.",
    whereToBreakSummary: {
      targetStep: 1,
      breakActionTitle: "아이의 생각 먼저 듣고 조율하기",
      breakActionDetail:
        "안 된다고 바로 자르기보다 '어떤 생각인지 먼저 말해줘' 하고 듣는 틈을 열어주는 방식이 도움이 될 수 있어요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_assertion_listen_first",
        situation: "아이가 자기 의견을 분명하게 말할 때",
        before: "안 된다고 했잖아.",
        after: "네 생각부터 듣고, 내 이유도 이야기해줄게.",
        whyItMayHelp:
          "아이의 의견을 먼저 들은 뒤 {{CG의}} 이유를 설명하면, 서로의 생각을 주고받는 방식으로 대화를 이어갈 수 있어요.",
        evidenceRefs: ["child:self_assertion_asserts_but_negotiates"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_ask_intent_first",
        actionTitle: "아이 생각 먼저 묻기",
        actionDetail: "반대하기 전 아이의 의도를 먼저 질문으로 확인해주세요.",
        whyItMayHelp: "의견이 먼저 존중받는 대화의 첫 단추가 될 수 있어요.",
        evidenceRefs: ["child:self_assertion_asserts_but_negotiates"],
      },
    ],
    anchorPromise: "아이의 의견을 먼저 들어주는 소통이 편안한 대화를 만듭니다.",
  },

  // 9. Low-Friction / Collaborative: 순응/유연한 아이와 조율형 엄마 (Fixture H, F, G 등 유연 상황)
  {
    ruleId: "rule_collab_flexible_and_adaptable",
    title: "아이의 유연한 흐름과 {{CG의}} 여유로운 대처가 맞물릴 때",
    requiredChildPatterns: [
      "context_flexible",
      "switches_readily",
      "moderate_pace",
      "accepts_suggestion_well",
    ],
    requiredMomPatterns: [
      "child_lead_adaptation",
      "situational_acceptance",
      "opt_time_wait",
      "opt_emo_redirect",
      "opt_inst_defer",
      "opt_rout_follow_child",
      "opt_rec_natural",
    ],
    applicableConcerns: ["all", "etc", "discipline", "friends"],
    confidence: "medium",
    interactionType: "collaborative",
    childPerspectiveSummary:
      "상황 변화나 {{CG의}} 안내에 비교적 유연하게 반응하며 자기 페이스를 맞춰가요.",
    momPerspectiveSummary:
      "상황이 바뀌어도 무리하게 통제하기보다 상황에 맞춰 여유롭게 넘기려는 태도예요.",
    synthesisSummary:
      "서로 간의 불필요한 마찰이 적고, 작은 변수에도 자연스럽게 일상으로 돌아오는 편안한 모습을 보여줍니다.",
    whereToBreakSummary: {
      targetStep: 1,
      breakActionTitle: "현재의 편안한 소통 방식 이어가기",
      breakActionDetail:
        "갈등이 적은 상황에서는 굳이 통제를 늘리기보다 지금처럼 아이와 유연하게 맞춰가는 방식을 유지해주세요.",
    },
    samplePhrases: [], // OMIT: 유연한 상황에서는 억지 Before/After 교정 문구를 생성하지 않음
    sampleActions: [
      {
        actionId: "action_express_gratitude",
        actionTitle: "아이의 협조에 고마움 표현하기",
        actionDetail: "“오늘 도와줘서 고마워” 하고 편안하게 표현해주세요.",
        whyItMayHelp: "편안한 소통을 이어가는 따뜻한 인사가 될 수 있어요.",
        evidenceRefs: ["child:rule_response_context_flexible"],
      },
    ],
    anchorPromise: "서로에게 부담을 주지 않는 편안한 일상의 대화를 소중히 지켜가세요.",
  },

  // 10. 식습관/편식: 처음 보는 음식에 신중한 아이 vs 골고루 먹이고 싶은 엄마 (meal 전용)
  {
    ruleId: "rule_friction_meal_new_food_hesitation",
    title: "처음 보는 음식에 신중한 아이와 골고루 먹이고 싶은 {{CG}}",
    // P2.2V.4 FIX: Food Micro Check 응답(new_food_hesitation, food_familiar_preference)을
    // 1차 근거로 사용한다. 일반 new_environment 관찰(needs_observation_time)은 음식 맥락의
    // 직접 근거가 아니므로 TRANSFERRED_LOW 보조 신호로만 남긴다.
    requiredChildPatterns: [
      "new_food_hesitation",
      "food_familiar_preference",
      "needs_observation_time",
      "prefers_completion_before_transition",
    ],
    requiredMomPatterns: [
      "fast_pace_directive",
      "firm_boundary_insistence",
      "logical_explanation_first",
      "opt_time_control",
      "opt_inst_firm",
      "opt_emo_explain",
      "opt_rec_ruminate",
    ],
    applicableConcerns: ["meal"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "익숙하지 않은 음식을 마주했을 때 스스로 눈으로 확인하고 탐색할 시간이 필요해요.",
    momPerspectiveSummary:
      "아이의 건강과 영양을 생각해 조금이라도 골고루 먹여주고 싶은 마음이에요.",
    synthesisSummary:
      "{{CG의}} 영양을 챙기려는 권유와 처음 보는 음식에 신중한 아이의 탐색 시간이 식탁에서 마주치며 실랑이가 길어질 수 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "억지로 권하기 전 음식 탐색 틈 주기",
      breakActionDetail:
        "먹으라고 재촉하기 전에 냄새를 맡거나 작게 떼어 탐색할 수 있는 선택권을 주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_meal_explore_first",
        situation: "처음 보는 반찬이나 음식을 완강히 거부할 때",
        before: "한 입만 먹어봐, 진짜 맛있는 거야.",
        after: "어떤 냄새가 나는지 먼저 맡아볼까? 먹지 않고 보기만 해도 괜찮아.",
        whyItMayHelp:
          "바로 먹어야 하는 선택지만 주기보다, 냄새나 모양을 먼저 살펴보는 선택지도 함께 열어줄 수 있어요.",
        evidenceRefs: ["child:food_new_food_new_food_hesitation", "concern:meal"],
      },
      {
        phraseId: "phrase_meal_favorite_acknowledge",
        situation: "좋아하는 반찬만 골라 먹으려 할 때",
        before: "골고루 안 먹으면 키 안 큰다.",
        after: "이 반찬이 제일 맛있구나. 좋아하는 거 먼저 먹고 다른 반찬은 젓가락으로 콕 찍어볼까?",
        whyItMayHelp:
          "아이가 좋아하는 음식을 인정해주면서 새로운 음식에 대한 접근을 부드럽게 시도할 수 있어요.",
        evidenceRefs: ["child:food_preference_food_familiar_preference", "concern:meal"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_meal_small_portion",
        actionTitle: "새로운 음식은 작은 조각으로 따로 담아주기",
        actionDetail:
          "밥 위에 바로 얹어주기보다 작은 접시에 따로 담아 아이가 스스로 냄새나 모양을 살필 수 있게 해주세요.",
        whyItMayHelp: "아이가 식사 속도와 선택권을 스스로 조절하는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:food_new_food_new_food_hesitation", "concern:meal"],
      },
      {
        actionId: "action_meal_touch_ingredient",
        actionTitle: "식사 전 음식 재료 함께 만져보기",
        actionDetail:
          "식사 준비 때 채소를 씻거나 만져보는 작은 참여 기회를 만들어주세요.",
        whyItMayHelp: "낯선 음식을 먼저 만지거나 살펴보는 선택지를 늘리는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:food_new_food_new_food_hesitation", "concern:meal"],
      },
    ],
    anchorPromise: "식탁에서 한 입 더 먹이는 것보다, 음식을 편안하게 마주할 작은 틈을 열어주는 것부터 시작해보세요.",
  },

  // 11. 식습관/편식: 자기 식사 속도와 주도성 고수 vs 식사 시간 관리 엄마 (meal 전용)
  {
    ruleId: "rule_friction_meal_autonomy_pacing",
    title: "자신의 식사 속도를 지키려는 아이와 정해진 식사 시간을 챙기는 {{CG}}",
    // P2.2V.4 FIX: Food Micro Check 응답(meal_pacing_autonomy, food_refusal_on_pressure)을
    // 1차 근거로 사용한다. 일반 문항 패턴(strong_self_direction 등)은 보조 신호로만 남기고,
    // 존재하지 않던 pattern id(strong_independent_preference 등)는 제거한다.
    requiredChildPatterns: [
      "meal_pacing_autonomy",
      "food_refusal_on_pressure",
      "strong_self_direction",
      "own_way_first",
      "reason_seeking",
      "deep_single_focus",
    ],
    requiredMomPatterns: [
      "fast_pace_directive",
      "firm_boundary_insistence",
      "time_notice_prompt",
      "opt_time_control",
      "opt_inst_firm",
      "opt_time_notify",
    ],
    applicableConcerns: ["meal"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "자신이 원하는 양과 속도로 식사하고 싶으며, 강요받는 느낌이 들면 완강해질 수 있어요.",
    momPerspectiveSummary:
      "식사 시간이 너무 길어지거나 장난을 치지 않고 제시간에 다 먹었으면 하는 마음이에요.",
    synthesisSummary:
      "식사 시간을 관리하려는 {{CG의}} 지도와 자기 방식대로 먹으려는 아이의 주도성이 맞부딪히는 양상이에요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "강요 대신 식사 종료 기준 함께 정하기",
      breakActionDetail:
        "남은 양을 다 먹이려 하기보다 '두 숟가락 더 먹고 식사 끝내기'처럼 명확한 마침표를 정해주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_meal_ending_marker",
        situation: "식탁에서 딴청을 피우거나 식사를 멈추지 않을 때",
        before: "빨리 먹어, 장난치지 말고!",
        after: "식사 시간 5분 남았어. 지금 남은 밥 중에 딱 두 숟가락만 맛있게 먹고 정리할까?",
        whyItMayHelp:
          "아이가 식사의 마침표를 예측하고 스스로 마무리할 수 있는 기회를 주는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:food_meal_flow_meal_pacing_autonomy", "concern:meal"],
      },
      {
        phraseId: "phrase_meal_acknowledge_full",
        situation: "먹기 싫다고 식탁에서 일어나려 할 때",
        before: "다 먹을 때까지 못 일어나.",
        after: "배가 이제 부르구나. 국물 한 모금 마시고 자리에서 일어날까?",
        whyItMayHelp:
          "아이의 배부름 신호를 인정해주면서 부드럽게 식사를 마무리하는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:food_prompt_response_food_refusal_on_pressure", "concern:meal"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_meal_visual_timer",
        actionTitle: "식사 마침표 시계나 모래시계 활용하기",
        actionDetail:
          "식사 시작 시 모래시계를 두거나 끝나는 시간을 미리 알려주어 스스로 속도를 조절하게 해주세요.",
        whyItMayHelp: "잔소리 대신 시각적인 신호로 전환을 돕는 방법이 될 수 있어요.",
        evidenceRefs: ["child:food_meal_flow_meal_pacing_autonomy", "concern:meal"],
      },
      {
        actionId: "action_meal_portion_choice",
        actionTitle: "식판 덜어먹기 선택권 주기",
        actionDetail:
          "아이가 직접 먹을 만큼만 덜어먹게 하여 스스로 정한 양을 다 먹는 성취감을 경험하게 해주세요.",
        whyItMayHelp: "자기주도성을 존중하여 식사에 대한 거부감을 줄이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:food_prompt_response_food_refusal_on_pressure", "concern:meal"],
      },
    ],
    anchorPromise: "다 먹이는 것보다, 기분 좋게 식탁을 마무리하는 경험을 쌓는 것부터 시작해보세요.",
  },

  // 12. 수면/잠자리: 하던 활동 마무리 필요 × 취침 흐름 재촉 (sleep 전용)
  {
    ruleId: "rule_friction_sleep_transition_vs_pace",
    title: "잠자리 전에도 하던 활동을 이어가려는 아이와 취침 흐름을 챙기는 {{CG}}",
    requiredChildPatterns: [
      "sleep_transition_needs_completion",
      "sleep_transition_delays_bedtime",
      "sleep_prebed_continues_activity",
      "sleep_transition_strong_refusal",
    ],
    requiredMomPatterns: [
      "fast_pace_directive",
      "time_notice_prompt",
      "firm_boundary_insistence",
      "opt_time_control",
      "opt_time_notify",
      "opt_inst_firm",
    ],
    applicableConcerns: ["sleep"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "잠자리 시간이 되어도 하던 활동을 이어가려는 모습이 있어요.",
    momPerspectiveSummary:
      "정해진 취침 시간과 흐름을 지키려 하며 잠자리로 이끌려는 반응이에요.",
    synthesisSummary:
      "{{CG의}} 취침 흐름을 빠르게 이어가려는 권유와 아이가 하던 활동을 이어가려는 반응이 잠자리 직전에 맞부딪히며 실랑이가 길어질 수 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "잠자리로 가기 전 마지막 행동 하나 정하기",
      breakActionDetail:
        "‘이제 자자’고 바로 끊기 전에, 지금 하던 활동에서 마지막으로 할 행동 하나를 같이 정해주세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_sleep_completion_bridge",
        situation: "하던 놀이를 멈추고 잠자리로 가야 할 때",
        before: "이제 그만하고 빨리 자.",
        after: "그림책 한 페이지만 더 보고 잠옷 입으러 갈까?",
        whyItMayHelp:
          "바로 잠자리로 가는 선택지만 주기보다, 하던 활동을 어디에서 마칠지 먼저 정해볼 수 있어요.",
        evidenceRefs: ["child:sleep_bedtime_sleep_transition_needs_completion", "concern:sleep"],
      },
      {
        phraseId: "phrase_sleep_pace_acknowledge",
        situation: "잠자리로 가기 싫어하며 다른 행동을 찾을 때",
        before: "빨리 누워! 늦었어.",
        after: "지금 하던 거 마지막으로 뭐 할지 같이 정해볼까? 정해지면 잠옷 입으러 가자.",
        whyItMayHelp:
          "재촉을 반복하기보다 현재 활동의 마지막 지점을 아이와 짧게 확인하는 방식이에요.",
        evidenceRefs: ["child:sleep_bedtime_sleep_transition_delays_bedtime", "concern:sleep"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_sleep_last_step",
        actionTitle: "마지막 행동 정하기",
        actionDetail:
          "잠자리로 넘어가기 전, 지금 하던 활동에서 마지막 행동 하나를 같이 정해보세요.",
        whyItMayHelp:
          "마지막 행동을 하나 정하면, 그 행동이 끝난 뒤 다음 순서로 넘어가도록 안내할 수 있어요.",
        evidenceRefs: ["child:sleep_bedtime_sleep_transition_needs_completion", "concern:sleep"],
      },
      {
        actionId: "action_sleep_transition_preview",
        actionTitle: "잠자리 전환 한 단계 미리 알려주기",
        actionDetail:
          "잠자리로 가기 직전에 ‘이제 ○○하고 잠옷 입으러 가자’처럼 다음 행동을 짧게 미리 알려주세요.",
        whyItMayHelp:
          "잠자리로 가기 직전에 다음 행동을 짧게 알려두면, 바로 끊기는 흐름 대신 순서를 함께 확인할 수 있어요.",
        evidenceRefs: ["child:sleep_bedtime_sleep_transition_delays_bedtime", "concern:sleep"],
      },
    ],
    anchorPromise:
      "잠자리로 재촉하기 전, 하던 활동의 마지막 지점을 함께 정하는 것부터 시작해보세요.",
  },

  // 13. 수면/잠자리: 익숙한 순서 선호 × 상황에 맞춘 순서 변경 (sleep 전용)
  {
    ruleId: "rule_friction_sleep_routine_vs_change",
    title: "익숙한 잠자리 순서를 지키려는 아이와 상황에 맞게 바꾸는 {{CG}}",
    requiredChildPatterns: [
      "sleep_routine_prefers_familiar_sequence",
      "sleep_routine_resists_change",
    ],
    requiredMomPatterns: [
      "rapid_rescheduling",
      "preference_for_structure",
      "opt_rout_replan",
      "opt_rout_hold_plan",
      "opt_time_control",
    ],
    applicableConcerns: ["sleep"],
    confidence: "high",
    interactionType: "friction",
    childPerspectiveSummary:
      "익숙한 잠자리 준비 순서를 따라갈 때 더 편안하게 흐름을 이어가려는 모습이 있어요.",
    momPerspectiveSummary:
      "상황에 맞게 순서를 바꾸거나 빠르게 다음 단계로 넘기려는 반응이에요.",
    synthesisSummary:
      "{{CG가}} 상황에 맞게 순서를 바꾸려 할 때와 아이가 익숙한 잠자리 흐름을 지키려 할 때 실랑이가 생길 수 있어요.",
    whereToBreakSummary: {
      targetStep: 2,
      breakActionTitle: "익숙한 잠자리 순서 하나 먼저 고정하기",
      breakActionDetail:
        "매일 모든 과정을 똑같이 할 필요는 없지만, 아이에게 익숙한 잠자리 순서 하나를 먼저 정해보세요.",
    },
    samplePhrases: [
      {
        phraseId: "phrase_sleep_routine_anchor",
        situation: "평소와 다른 순서로 잠자리 준비를 하려 할 때",
        before: "오늘은 빨리 하자, 순서 상관없어.",
        after: "오늘은 책 읽기부터 할까, 양치부터 할까? 네가 고른 순서대로 해보자.",
        whyItMayHelp:
          "순서를 완전히 바꾸기보다 선택지 안에서 정하면 거부감을 줄이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:sleep_routine_sleep_routine_prefers_familiar_sequence", "concern:sleep"],
      },
    ],
    sampleActions: [
      {
        actionId: "action_sleep_familiar_sequence",
        actionTitle: "익숙한 순서 한 가지 유지하기",
        actionDetail:
          "매일 모든 과정을 똑같이 만들 필요는 없지만, 아이에게 익숙한 잠자리 순서 하나를 유지해보세요.",
        whyItMayHelp: "예측 가능한 흐름이 잠자리 준비 부담을 줄이는 데 도움이 될 수 있어요.",
        evidenceRefs: ["child:sleep_routine_sleep_routine_resists_change", "concern:sleep"],
      },
      {
        actionId: "action_sleep_sequence_choice",
        actionTitle: "바뀌는 날은 선택지로 순서 정하기",
        actionDetail:
          "순서를 바꿔야 할 때는 ‘A부터 할까, B부터 할까?’처럼 두 가지 안에서 고르게 해주세요.",
        whyItMayHelp: "일방적 변경 대신 작은 선택권을 주는 방식을 시도해볼 수 있어요.",
        evidenceRefs: ["child:sleep_routine_sleep_routine_prefers_familiar_sequence", "concern:sleep"],
      },
    ],
    anchorPromise:
      "순서를 바꿔야 할 때도, 익숙한 흐름 하나를 먼저 정해주는 것부터 시작해보세요.",
  },
];
