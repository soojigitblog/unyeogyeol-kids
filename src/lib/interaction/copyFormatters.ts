import { subj, topic } from "@/lib/caregiver";

/** 입력 관찰 문장(…함)을 자연스러운 과거 관찰형으로 변환 */
export function formatChildObserved(childName: string, childReact: string): string {
  const trimmed = childReact.trim();
  if (trimmed.endsWith("함")) {
    const body = trimmed.slice(0, -1).trim();
    return `${topic(childName)} ${body}는 모습이 있었어요.`;
  }
  return `${topic(childName)} ${trimmed}`;
}

/** Conflict Chain 등 간결 서술용 — 입력 문장 유지, 주어만 붙임 */
export function formatChildReactShort(childName: string, childReact: string): string {
  const trimmed = childReact.trim();
  return `${subj(childName)} ${trimmed.endsWith(".") ? trimmed : `${trimmed}.`}`;
}

function extractEmbeddedQuote(text: string): string | undefined {
  const match = text.match(/[''""「『]([^''""」』]+)[''""」』]/);
  return match?.[1]?.trim();
}

/**
 * structured reaction + typical phrase 중복 없이 한 문장으로 합침.
 *
 * P2.4 긴급 수정: 이전에는 원문 전체에 /잠|취침|자/ 같은 느슨한 정규식을 걸어
 * "재촉"이면 무조건 수면 문구("잠자리로 가도록")를 붙였다. "하자", "가자" 같은
 * 극히 흔한 한국어 종결어미에도 "자"가 들어있어, discipline 등 다른 Concern에서도
 * 수면 문구가 섞여 들어가는 Cross-Concern Leakage 버그였다.
 * 지금은 concernId 로 명시적으로 게이팅한다 — 실제 Concern이 sleep/meal이 아니면
 * 해당 Concern 전용 문구를 붙이지 않는다(Concern Hard Lock).
 */
export function mergeCaregiverReactionSentence(
  caregiverRoleLabel: string,
  momReact: string,
  typicalPhrase?: string,
  concernId?: string
): string {
  const react = momReact.trim();
  const phrase = typicalPhrase?.trim();
  const embedded = extractEmbeddedQuote(react);

  const phrasePrefix = phrase?.split(",")[0]?.trim();
  const effectiveQuote =
    embedded && phrase && phrasePrefix && (phrase.includes(embedded) || embedded.includes(phrasePrefix))
      ? embedded
      : phrase && react.includes(phrase)
      ? phrase
      : embedded || phrase;

  const isPushHurry = /재촉/.test(react);
  const isMealHandoff = concernId === "meal" && /숟가락|건넴/.test(react);
  const isSleepPush = concernId === "sleep" && isPushHurry;

  if (effectiveQuote && react.includes(effectiveQuote)) {
    if (isSleepPush) {
      return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말하며 잠자리로 가도록 재촉했어요.`;
    }
    if (isPushHurry) {
      return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말하며 재촉했어요.`;
    }
    if (isMealHandoff) {
      return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말하며 숟가락을 건넸어요.`;
    }
    return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말했어요.`;
  }

  if (embedded) {
    if (isMealHandoff) {
      return `${subj(caregiverRoleLabel)} ‘${embedded}’라고 말하며 숟가락을 건넸어요.`;
    }
    if (isPushHurry) {
      return `${subj(caregiverRoleLabel)} ‘${embedded}’라고 말하며 재촉했어요.`;
    }
    return `${subj(caregiverRoleLabel)} ‘${embedded}’라고 말했어요.`;
  }

  if (phrase && !react.includes(phrase)) {
    return `${subj(caregiverRoleLabel)} ‘${phrase}’라고 말하며 ${react}`;
  }

  if (react.endsWith("함")) {
    const body = react.slice(0, -1).trim();
    return `${subj(caregiverRoleLabel)} ${body}는 반응이 있었어요.`;
  }

  return `${subj(caregiverRoleLabel)} ${react}`;
}

/** Ch02 — 확인된 보호자 반응 (입력 근거) */
export function formatCaregiverObservedReaction(
  caregiverRoleLabel: string,
  momReact: string,
  typicalPhrase?: string,
  concernId?: string
): string {
  const merged = mergeCaregiverReactionSentence(caregiverRoleLabel, momReact, typicalPhrase, concernId);
  return merged
    .replace(/재촉했어요\.$/, "재촉하는 반응이 있었어요.")
    .replace(/말했어요\.$/, "말하는 반응이 있었어요.");
}

/** subsequentEscalation — 사실 단계 서술 */
export function formatEscalationFact(escalation: string, childName?: string): string {
  let trimmed = escalation.trim();
  if (childName && trimmed.startsWith("아이가")) {
    trimmed = trimmed.replace(/^아이가/, subj(childName));
  }
  if (trimmed.endsWith("함")) {
    trimmed = `${trimmed.slice(0, -1).trim()}음`;
  }
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

/** typicalPhrase가 momReact에 이미 포함되면 scene narrative에 중복 인용 금지 */
export function sceneUsesDuplicateQuote(momReact: string, typicalPhrase?: string): boolean {
  const phrase = typicalPhrase?.trim();
  if (!phrase) return false;
  return momReact.includes(phrase);
}
