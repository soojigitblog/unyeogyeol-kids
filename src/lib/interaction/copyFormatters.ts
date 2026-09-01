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

/** structured reaction + typical phrase 중복 없이 한 문장으로 합침 */
export function mergeCaregiverReactionSentence(
  caregiverRoleLabel: string,
  momReact: string,
  typicalPhrase?: string
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

  if (effectiveQuote && react.includes(effectiveQuote)) {
    if (/재촉/.test(react)) {
      if (/잠|취침|자/.test(`${react}${effectiveQuote}`)) {
        return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말하며 잠자리로 가도록 재촉했어요.`;
      }
      return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말하며 재촉했어요.`;
    }
    if (/숟가락|건넴|권유/.test(react)) {
      return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말하며 숟가락을 건넸어요.`;
    }
    if (/설명|권유|말/.test(react)) {
      return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말했어요.`;
    }
    return `${subj(caregiverRoleLabel)} ‘${effectiveQuote}’라고 말했어요.`;
  }

  if (embedded) {
    if (/숟가락|건넴/.test(react)) {
      return `${subj(caregiverRoleLabel)} ‘${embedded}’라고 말하며 숟가락을 건넸어요.`;
    }
    if (/재촉/.test(react)) {
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
  typicalPhrase?: string
): string {
  const merged = mergeCaregiverReactionSentence(caregiverRoleLabel, momReact, typicalPhrase);
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
