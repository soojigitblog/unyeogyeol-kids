import { KidsAiError } from "@/lib/ai/kidsAiErrors";

const REGENERABLE_CODES = new Set(["SCHEMA_VALIDATION_FAILED", "SAFETY_VALIDATION_FAILED", "STRUCTURED_PARSE_FAILED"]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 검증 실패(스키마/안전 게이트) 시 1회만 재생성. 전송 오류는 generateKidsStructured가 이미 처리한다. */
export async function withKidsValidationRetry<T>(
  run: (rejectionFeedback?: string) => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const regenerable = error instanceof KidsAiError && REGENERABLE_CODES.has(error.code);
    if (!regenerable) throw error;
    await sleep(400);
    return run(error.message);
  }
}
