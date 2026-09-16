// P3.2 §16~17: Recovery API 전용 레이트리밋.
// 최소비용 원칙 — 추가 유료 인프라 없이 Supabase(report_recovery_attempts) 하나로 구현.

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  useMemoryCommerceStore as isMemoryCommerceStore,
  memoryRecordAttempt,
  memoryCountAttempts,
  memoryPruneAttempts,
  memoryPruneAllAttemptsOlderThan,
} from "@/lib/supabase/memoryStore";

const SESSION_WINDOW_MS = 15 * 60 * 1000;
const SESSION_MAX_FAILURES = 5;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_FAILURES = 8;
const GLOBAL_WINDOW_MS = 60 * 1000;
const GLOBAL_MAX_ATTEMPTS = 200;
// §17: 슬라이딩 윈도우 판정에는 최근 창(길어야 15분)만 필요하지만, 사후 어뷰징 조사 여유를
// 위해 21일(14~30일 권장 범위 내)만 보존한다. 그 이상은 어차피 판정에 쓰이지 않는다.
const ATTEMPT_RETENTION_MS = 21 * 24 * 60 * 60 * 1000;
const GLOBAL_PRUNE_PROBABILITY = 0.05;

export const GLOBAL_BUCKET = "global";

export class RateLimitedError extends Error {
  constructor() {
    super("RATE_LIMITED");
    this.name = "RateLimitedError";
  }
}

export interface RecoveryBuckets {
  sessionBucket: string;
  ipBucket: string | null;
}

export function getSessionBucket(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * x-forwarded-for 는 클라이언트가 위조할 수 있는 헤더다. 실제 배포 환경에서 신뢰 가능한
 * 프록시가 이 값을 덮어쓴다는 사실이 확인되기 전까지는(TRUST_PROXY_IP_HEADER=true로 명시
 * 켜기 전까지는) IP 리미터를 아예 비활성화한다 — session/global 리미터만으로도 온라인
 * 대입 방어는 이미 충분하다(§16).
 */
export function getTrustedIpBucket(request: NextRequest): string | null {
  if (process.env.TRUST_PROXY_IP_HEADER !== "true") return null;
  const secret = process.env.RATE_LIMIT_IP_SECRET;
  if (!secret) return null;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  if (!ip) return null;
  // RECOVERY_CODE_SECRET과 용도를 분리한 별도 시크릿으로 HMAC — 하나가 유출돼도
  // 다른 하나에는 영향이 없도록 한다(§7/§16).
  const hash = createHmac("sha256", secret).update(ip).digest("hex");
  return `ip:${hash}`;
}

async function countFailuresSince(bucketKey: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  if (isMemoryCommerceStore()) {
    return memoryCountAttempts(bucketKey, since, false);
  }
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("report_recovery_attempts")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .eq("succeeded", false)
    .gt("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

async function countAllSince(bucketKey: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  if (isMemoryCommerceStore()) {
    return memoryCountAttempts(bucketKey, since);
  }
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("report_recovery_attempts")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .gt("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

/** 코드 존재 여부를 노출하지 않도록, 호출부는 이 에러를 다른 실패와 동일한 문구로 응답해야 한다(429만 상태코드가 다름). */
export async function assertNotRateLimited(buckets: RecoveryBuckets): Promise<void> {
  const [sessionFailures, globalAttempts] = await Promise.all([
    countFailuresSince(buckets.sessionBucket, SESSION_WINDOW_MS),
    countAllSince(GLOBAL_BUCKET, GLOBAL_WINDOW_MS),
  ]);
  if (sessionFailures >= SESSION_MAX_FAILURES) throw new RateLimitedError();
  if (globalAttempts >= GLOBAL_MAX_ATTEMPTS) throw new RateLimitedError();
  if (buckets.ipBucket) {
    const ipFailures = await countFailuresSince(buckets.ipBucket, IP_WINDOW_MS);
    if (ipFailures >= IP_MAX_FAILURES) throw new RateLimitedError();
  }
}

export async function recordRecoveryAttempt(
  buckets: RecoveryBuckets,
  succeeded: boolean
): Promise<void> {
  const keys = [buckets.sessionBucket, GLOBAL_BUCKET, ...(buckets.ipBucket ? [buckets.ipBucket] : [])];
  const now = new Date().toISOString();

  if (isMemoryCommerceStore()) {
    for (const key of keys) memoryRecordAttempt(key, succeeded);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("report_recovery_attempts")
      .insert(keys.map((bucket_key) => ({ bucket_key, succeeded, created_at: now })));
    if (error) throw error;
  }

  const cutoff = new Date(Date.now() - ATTEMPT_RETENTION_MS).toISOString();
  await pruneBuckets(keys, cutoff);
  // §17: 재요청하지 않는 과거 bucket_key는 위 pruning으로 지워지지 않으므로,
  // 낮은 확률로 전체 오래된 행을 정리해 무한 증가를 막는다(별도 스케줄러 없이).
  if (Math.random() < GLOBAL_PRUNE_PROBABILITY) {
    await pruneAllOlderThan(cutoff);
  }
}

async function pruneBuckets(bucketKeys: string[], cutoffIso: string): Promise<void> {
  if (isMemoryCommerceStore()) {
    memoryPruneAttempts(bucketKeys, cutoffIso);
    return;
  }
  const supabase = getSupabaseAdmin();
  await supabase
    .from("report_recovery_attempts")
    .delete()
    .in("bucket_key", bucketKeys)
    .lt("created_at", cutoffIso);
}

async function pruneAllOlderThan(cutoffIso: string): Promise<void> {
  if (isMemoryCommerceStore()) {
    memoryPruneAllAttemptsOlderThan(cutoffIso);
    return;
  }
  const supabase = getSupabaseAdmin();
  await supabase.from("report_recovery_attempts").delete().lt("created_at", cutoffIso);
}
