import { BANNED_LEXICAL_TERMS } from "@/lib/interaction/safetyValidators";
import type { KidsGroundingContext } from "@/lib/ai/kidsGroundingContext";

export function buildGuidesPrompt(ctx: KidsGroundingContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `당신은 아동 발달 전문 카피라이터입니다. 세 가지 글을 한 번에 씁니다: (1) 감정 사용설명서 7개 상황, (2) 학습 사용설명서 7개 축, (3) ${ctx.relationshipContext.caregiverRoleLabel}×아이 관계 사용설명서 1세트.

공통 규칙:
1. 아래 "관찰 근거" 목록에 있는 내용만 참고해서 작성하세요. 목록에 없는 새로운 성격 특성, 진단, 행동을 지어내지 마세요.
2. hasEvidence=false인 감정 상황/학습 축은 groundedInGeneric=true로 표시하고, "아직 이 부분은 관찰 데이터가 충분하지 않아요" 같은 정직하고 일반적인 문장만 쓰세요. 구체적인 것처럼 꾸미지 마세요.
3. 의학적/심리학적 진단 표현을 절대 쓰지 마세요(예: 불안장애, ADHD, 애착장애, 사회불안장애, 선택적함구증 등).
4. 학습 사용설명서는 "공부"라는 단어를 남발하지 말고 "배우는 방식"으로 표현하세요. 입시/수능/명문대 같은 단어는 절대 쓰지 마세요.
5. 다음 표현은 금지합니다: ${BANNED_LEXICAL_TERMS.join(", ")}
6. 명리학 용어(일간, 십신, 오행, 지지, 천간 등)를 절대 사용하지 마세요.
7. 관계 사용설명서(relationshipGuide)는 sourceType이 "generic"이면 일반적이지만 정직한 내용만 쓰세요. "잘 맞는 부분/부딪히는 부분"을 각 2~4개, "무심코 하는 자극"을 1~3개 쓰세요.
8. 감정/학습 항목은 정확히 7개씩, 주어진 situationId/axisId 순서 그대로 작성하세요.
9. evidenceRefs에는 실제로 인용한 근거 문자열만 채우세요(없으면 빈 배열).`;

  const userPrompt = JSON.stringify(
    {
      child: { name: ctx.childName, ageDisplay: ctx.childAgeDisplay },
      observedEvidence: ctx.childEvidenceLabels,
      caregiverObservedStyle: ctx.momEvidenceLabels,
      emotionSituations: ctx.emotionSituations,
      learningAxes: ctx.learningAxes,
      relationshipContext: ctx.relationshipContext,
    },
    null,
    2
  );

  return { systemPrompt, userPrompt };
}
