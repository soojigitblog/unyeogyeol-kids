// P3.4 AI 설정 — KIDS 프로젝트 전용, saju(어른사주)의 멀티프로바이더 구조보다
// 훨씬 단순하다: OpenAI 단일 프로바이더, "결제 시 1회" 단일 용도.
//
// AI_MODE=mock (기본값, 테스트/로컬 안전) | live (실제 OpenAI 호출).
// 모델명은 하드코딩하지 않는다 — 반드시 AI_MODEL_KIDS 환경변수로 설정한다.
import "server-only";

export type KidsAiMode = "mock" | "live";

export function getKidsAiMode(): KidsAiMode {
  const raw = process.env.AI_MODE?.trim().toLowerCase();
  return raw === "live" ? "live" : "mock";
}

export function getKidsOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

export function getKidsAiModel(): string {
  const model = process.env.AI_MODEL_KIDS?.trim();
  if (!model) {
    throw new Error(
      "AI_MODEL_KIDS is not set. Configure a specific OpenAI model id before enabling AI_MODE=live."
    );
  }
  return model;
}

export function getKidsAiTimeoutMs(): number {
  const raw = process.env.AI_TIMEOUT_MS_KIDS?.trim();
  const n = raw ? Number(raw) : 25_000;
  return Number.isFinite(n) && n > 0 ? n : 25_000;
}

export function getKidsAiMaxRetries(): number {
  const raw = process.env.AI_MAX_RETRIES_KIDS?.trim();
  const n = raw ? Number(raw) : 1;
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 2) : 1;
}
