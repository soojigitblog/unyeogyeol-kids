import OpenAI from "openai";
import { getKidsAiTimeoutMs, getKidsOpenAiApiKey } from "@/lib/ai/kidsAiConfig";
import { KidsAiError } from "@/lib/ai/kidsAiErrors";

let cached: OpenAI | null = null;

export function getKidsOpenAIClient(): OpenAI {
  const apiKey = getKidsOpenAiApiKey();
  if (!apiKey) {
    throw new KidsAiError("OPENAI_API_KEY_MISSING", "OPENAI_API_KEY is not configured.", {
      retryable: false,
    });
  }
  if (cached) return cached;
  cached = new OpenAI({
    apiKey,
    timeout: getKidsAiTimeoutMs(),
    maxRetries: 0, // 재시도는 상위 래퍼에서 직접 처리
  });
  return cached;
}

/** Test helper — reset singleton. */
export function resetKidsOpenAIClientForTests(): void {
  cached = null;
}
