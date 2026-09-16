// Soft in-memory rate limit for refund request submission.
// 최소비용 원칙 — 별도 인프라 없이 프로세스 메모리로 어뷰징만 완화한다.

export class RefundRateLimitedError extends Error {
  constructor() {
    super("RATE_LIMITED");
    this.name = "RefundRateLimitedError";
  }
}

export function assertRefundRequestRateLimit(sessionId: string): void {
  const limit = 5;
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();

  const g = globalThis as unknown as {
    __refundRequestRate?: Map<string, number[]>;
  };
  if (!g.__refundRequestRate) g.__refundRequestRate = new Map();

  const timestamps = (g.__refundRequestRate.get(sessionId) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= limit) {
    throw new RefundRateLimitedError();
  }
  timestamps.push(now);
  g.__refundRequestRate.set(sessionId, timestamps);
}
