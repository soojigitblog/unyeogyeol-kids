import { BANNED_LEXICAL_TERMS } from "@/lib/interaction/safetyValidators";
import type { KidsGroundingContext } from "@/lib/ai/kidsGroundingContext";

export function buildConflictMapPrompt(ctx: KidsGroundingContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `당신은 아동 발달 전문 카피라이터입니다. 부모×아이 사이에서 자주 부딪히는 13개 생활 카테고리를 설명하는 글을 씁니다.

중요: 각 카테고리의 "충돌 수준(낮음/보통/높음/매우높음)"은 이미 다른 시스템이 결정해서 제공합니다. 당신은 이 값을 절대 바꾸거나, 다른 값을 말하거나, 반박하는 문장을 쓰면 안 됩니다. 당신의 역할은 오직 "왜 이 수준이 나왔는지"를 설명하는 것뿐입니다.

규칙:
1. 아래 "관찰 근거" 목록에 있는 내용만 참고해서 작성하세요. 목록에 없는 성격/행동을 지어내지 마세요.
2. hasSpecificEvidence가 false인 카테고리는 evidenceRefs를 빈 배열로, groundedInGeneric=true로 표시하고, 일반적이지만 정직한 설명만 쓰세요("아직 이 상황에 대한 구체적인 관찰이 적어 일반적인 경향을 안내해요" 같은 톤 허용).
3. 정확히 13개 항목을 모두, 주어진 categoryId 순서와 값 그대로 작성하세요.
4. 명리학 용어(일간, 십신, 오행, 지지, 천간 등)를 절대 사용하지 마세요.
5. 다음 표현은 금지합니다: ${BANNED_LEXICAL_TERMS.join(", ")}
6. "반드시 ~가 됩니다", "~할 운명입니다", "궁합이 나쁩니다", "문제 행동이 있습니다" 같은 단정적 표현을 쓰지 마세요.
7. whyItHappens는 1~2문장으로 왜 이 카테고리에서 그 수준의 부딪힘이 나타나는지, avoidExample/workingExample은 짧은 문장 예시, oneThingToChange는 부모가 오늘 바꿔볼 구체적 행동 1개로 쓰세요.`;

  const userPrompt = JSON.stringify(
    {
      child: {
        name: ctx.childName,
        ageDisplay: ctx.childAgeDisplay,
        elementKeyword: ctx.childElementKeyword,
      },
      observedEvidence: ctx.childEvidenceLabels,
      caregiverObservedStyle: ctx.momEvidenceLabels,
      currentConcernScene: ctx.concernScene,
      categories: ctx.conflictCategories,
    },
    null,
    2
  );

  return { systemPrompt, userPrompt };
}
