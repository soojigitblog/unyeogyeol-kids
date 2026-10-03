export type KidsAiErrorCode =
  | "OPENAI_API_KEY_MISSING"
  | "OPENAI_TIMEOUT"
  | "OPENAI_RATE_LIMIT"
  | "OPENAI_SERVER_ERROR"
  | "OPENAI_BAD_REQUEST"
  | "STRUCTURED_PARSE_FAILED"
  | "SCHEMA_VALIDATION_FAILED"
  | "SAFETY_VALIDATION_FAILED"
  | "RETRY_EXHAUSTED"
  | "UNKNOWN";

export class KidsAiError extends Error {
  readonly code: KidsAiErrorCode;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(
    code: KidsAiErrorCode,
    message: string,
    options?: { retryable?: boolean; cause?: unknown }
  ) {
    super(message);
    this.name = "KidsAiError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}
