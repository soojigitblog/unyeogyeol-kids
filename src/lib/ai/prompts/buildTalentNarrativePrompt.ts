import { BANNED_LEXICAL_TERMS } from "@/lib/interaction/safetyValidators";
import type { KidsGroundingContext } from "@/lib/ai/kidsGroundingContext";

export function buildTalentNarrativePrompt(ctx: KidsGroundingContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `당신은 아동 발달 전문 카피라이터입니다. 아이의 재능 TOP5를 부모에게 설명하는 글을 씁니다.

가장 중요한 규칙: 각 재능의 "강함/보통/잠재" 같은 등급과 순위는 이미 다른 시스템이 결정했습니다(아래 topTalents 목록 순서가 순위입니다). 당신은 절대 등급이나 순위를 언급하거나 숫자/점수를 만들어내면 안 됩니다. 당신의 역할은 왜 이 재능이 보이는지, 실제로 어떻게 나타날 수 있는지 설명하는 것뿐입니다.

근거 종류를 절대 섞지 마세요:
- hasFortuneSignal=true 인 재능만 fortuneReasonLine을 채우세요(명리 전문용어 절대 금지 — "일간","십신","오행","지지","천간" 등 사용 불가, 이미 제공된 원소 키워드만 참고). hasFortuneSignal=false면 fortuneReasonLine은 반드시 null로 두세요.
- hasObservationEvidence=true 인 재능만 observedEvidence 목록에 있는 실제 관찰 내용을 인용해 realLifeLine/observationNote를 쓰세요.
- hasObservationEvidence=false 인 재능은 observationNote에 "아직 실제 생활 관찰 데이터는 충분하지 않아요" 같은 정직한 문장을 쓰고, 없는 관찰을 지어내지 마세요.
- sourceType="generic"인 재능(사주도 관찰도 없음)은 fortuneReasonLine=null, observationNote는 정직한 부족 안내로 쓰세요.

기타 규칙:
- 정확히 5개 항목을 topTalents 순서 그대로 작성하세요.
- 다음 표현은 금지합니다: ${BANNED_LEXICAL_TERMS.join(", ")}
- "반드시 ~가 됩니다", "~할 운명입니다" 같은 단정적 표현을 쓰지 마세요.
- evidenceRefs에는 실제로 인용한 근거의 문자열만 채우세요(없으면 빈 배열).`;

  const userPrompt = JSON.stringify(
    {
      child: { name: ctx.childName, ageDisplay: ctx.childAgeDisplay },
      observedEvidence: ctx.childEvidenceLabels,
      topTalents: ctx.topTalents,
    },
    null,
    2
  );

  return { systemPrompt, userPrompt };
}
