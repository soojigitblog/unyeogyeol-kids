import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

interface MemoryDb {
  guest_sessions: Row[];
  child_profiles: Row[];
  caregiver_profiles: Row[];
  assessment_inputs: Row[];
  reports: Row[];
  orders: Row[];
  report_ownerships: Row[];
  // P3.2 Guest Recovery — 기존 테이블은 전혀 건드리지 않고 추가된 컬렉션.
  report_recovery_codes: Row[];
  report_access_grants: Row[];
  report_recovery_attempts: Row[];
  // P3.3 Refund requests — 기존 컬렉션은 건드리지 않고 추가.
  refund_requests: Row[];
}

function emptyDb(): MemoryDb {
  return {
    guest_sessions: [],
    child_profiles: [],
    caregiver_profiles: [],
    assessment_inputs: [],
    reports: [],
    orders: [],
    report_ownerships: [],
    report_recovery_codes: [],
    report_access_grants: [],
    report_recovery_attempts: [],
    refund_requests: [],
  };
}

const globalStore = globalThis as typeof globalThis & { __uykCommerceDb?: MemoryDb };

function getDb(): MemoryDb {
  if (!globalStore.__uykCommerceDb) {
    globalStore.__uykCommerceDb = emptyDb();
  }
  return globalStore.__uykCommerceDb;
}

function match(row: Row, filters: Record<string, unknown>): boolean {
  return Object.entries(filters).every(([k, v]) => row[k] === v);
}

function createQuery(table: keyof MemoryDb) {
  const db = getDb();
  let filters: Record<string, unknown> = {};
  let inFilter: { col: string; vals: unknown[] } | null = null;
  let isNullCol: string | null = null;
  let orderCol: string | null = null;
  let orderAsc = true;
  let limitOne = false;
  let upsertConflict: string | null = null;
  let ignoreDuplicates = false;

  const api = {
    select(_cols?: string) {
      return api;
    },
    eq(col: string, val: unknown) {
      filters[col] = val;
      return api;
    },
    in(col: string, vals: unknown[]) {
      inFilter = { col, vals };
      return api;
    },
    is(col: string, val: unknown) {
      if (val === null) isNullCol = col;
      return api;
    },
    neq(col: string, val: unknown) {
      filters[`__neq_${col}`] = val;
      return api;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      orderCol = col;
      orderAsc = opts?.ascending !== false;
      return api;
    },
    maybeSingle() {
      limitOne = true;
      return api;
    },
    single() {
      limitOne = true;
      return api;
    },
    upsert(rows: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
      upsertConflict = opts?.onConflict ?? null;
      ignoreDuplicates = opts?.ignoreDuplicates ?? false;
      const list = Array.isArray(rows) ? rows : [rows];
      for (const row of list) {
        if (upsertConflict) {
          const keys = upsertConflict.split(",").map((k) => k.trim());
          const existing = db[table].find((r) => keys.every((k) => r[k] === row[k]));
          if (existing) {
            if (!ignoreDuplicates) Object.assign(existing, row);
          } else {
            db[table].push({ ...row });
          }
        } else {
          db[table].push({ ...row });
        }
      }
      return Promise.resolve({ data: list[0], error: null });
    },
    insert(row: Row | Row[]) {
      const list = (Array.isArray(row) ? row : [row]).map((r) => {
        const copy = { ...r };
        if (!copy.id) copy.id = randomUUID();
        db[table].push(copy);
        return copy;
      });
      const inserted = list[0];
      const chain = {
        select(_cols?: string) {
          return chain;
        },
        single: async () => ({ data: inserted, error: null }),
        then(
          resolve: (v: { data: Row | Row[] | null; error: null }) => void
        ) {
          resolve({ data: inserted, error: null });
          return Promise.resolve({ data: inserted, error: null });
        },
      };
      return chain;
    },
    update(patch: Row) {
      const conditions: Array<{ col: string; val: unknown; neq?: boolean }> = [];
      const chain = {
        eq(col: string, val: unknown) {
          conditions.push({ col, val });
          return chain;
        },
        neq(col: string, val: unknown) {
          conditions.push({ col, val, neq: true });
          return chain;
        },
        then(resolve: (v: { error: null }) => void) {
          db[table].forEach((r) => {
            const ok = conditions.every((c) =>
              c.neq ? r[c.col] !== c.val : r[c.col] === c.val
            );
            if (ok) Object.assign(r, patch);
          });
          resolve({ error: null });
          return Promise.resolve({ error: null });
        },
      };
      return chain;
    },
    then(resolve: (v: { data: Row | Row[] | null; error: null }) => void) {
      let rows = db[table].filter((r) => {
        if (!match(r, filters)) return false;
        if (inFilter && !inFilter.vals.includes(r[inFilter.col])) return false;
        if (isNullCol && r[isNullCol] != null) return false;
        for (const [k, v] of Object.entries(filters)) {
          if (k.startsWith("__neq_")) {
            const col = k.slice(6);
            if (r[col] === v) return false;
          }
        }
        return true;
      });
      if (orderCol) {
        rows = [...rows].sort((a, b) => {
          const av = String(a[orderCol!]);
          const bv = String(b[orderCol!]);
          return orderAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }
      const data = limitOne ? (rows[0] ?? null) : rows;
      resolve({ data, error: null });
      return Promise.resolve({ data, error: null });
    },
  };
  return api;
}

export function createMemorySupabaseClient(): SupabaseClient {
  return {
    from(table: string) {
      return createQuery(table as keyof MemoryDb) as unknown as ReturnType<
        SupabaseClient["from"]
      >;
    },
  } as SupabaseClient;
}

export function resetMemoryDb(): void {
  globalStore.__uykCommerceDb = emptyDb();
}

export function useMemoryCommerceStore(): boolean {
  return process.env.COMMERCE_STORE === "memory";
}

// ── P3.2 Guest Recovery: memory-store 전용 원자적 헬퍼 ──────────────────────
//
// 아래 함수들은 일부러 제네릭 쿼리 빌더(createQuery)를 거치지 않고 배열을 직접 조작한다.
// 이유:
//   1) createQuery는 delete/gt/lt/rpc를 지원하지 않는다(§2 조사 결과) — 범용 빌더를
//      확장하는 대신, 실제 필요한 곳에만 이런 전용 헬퍼를 추가하는 편이 기존 동작에 대한
//      회귀 위험이 없다.
//   2) "활성 recovery code는 report당 최대 1개" 동시성 보장은 실제 Postgres에서는
//      partial unique index + `select ... for update`로 강제되지만, memoryStore는
//      진짜 DB 트랜잭션이 없다. 대신 이 함수 전체를 **완전히 동기(synchronous)** 코드로
//      작성해 중간에 await 지점이 전혀 없도록 한다 — Node는 단일 스레드이므로, 동기
//      코드 블록 내부에서는 다른 요청이 끼어들 수 없다. `Promise.all([issue(), issue()])`
//      로 "동시 요청"을 흉내내도 각 호출의 임계구역이 이 함수 하나로 끝나 있으면
//      경합 없이 항상 하나만 성공한다 — 이게 §18 동시성 테스트가 memory 모드에서도
//      실제로 검증 가능한 이유다.

export function memoryIssueOrRotateRecoveryCode(input: {
  reportId: string;
  orderId: string;
  newCodeHash: string;
  rotate: boolean;
}): { ok: true; row: Row } | { ok: false; error: "ALREADY_ISSUED" } {
  const db = getDb();
  const existing = db.report_recovery_codes.find(
    (r) => r.report_id === input.reportId && r.revoked_at == null
  );
  if (existing && !input.rotate) {
    return { ok: false, error: "ALREADY_ISSUED" };
  }
  const now = new Date().toISOString();
  if (existing && input.rotate) {
    existing.revoked_at = now;
    for (const grant of db.report_access_grants) {
      if (grant.source_recovery_code_id === existing.id && grant.revoked_at == null) {
        grant.revoked_at = now;
      }
    }
  }
  const row: Row = {
    id: randomUUID(),
    report_id: input.reportId,
    order_id: input.orderId,
    code_hash: input.newCodeHash,
    created_at: now,
    revoked_at: null,
  };
  db.report_recovery_codes.push(row);
  return { ok: true, row };
}

export function memoryRecordAttempt(bucketKey: string, succeeded: boolean): void {
  const db = getDb();
  db.report_recovery_attempts.push({
    id: randomUUID(),
    bucket_key: bucketKey,
    succeeded,
    created_at: new Date().toISOString(),
  });
}

export function memoryCountAttempts(
  bucketKey: string,
  sinceIso: string,
  succeededOnly?: boolean
): number {
  const db = getDb();
  return db.report_recovery_attempts.filter((r) => {
    if (r.bucket_key !== bucketKey) return false;
    if ((r.created_at as string) <= sinceIso) return false;
    if (succeededOnly !== undefined && r.succeeded !== succeededOnly) return false;
    return true;
  }).length;
}

export function memoryPruneAttempts(bucketKeys: string[], cutoffIso: string): void {
  const db = getDb();
  const keySet = new Set(bucketKeys);
  db.report_recovery_attempts = db.report_recovery_attempts.filter(
    (r) => !(keySet.has(r.bucket_key as string) && (r.created_at as string) < cutoffIso)
  );
}

export function memoryPruneAllAttemptsOlderThan(cutoffIso: string): void {
  const db = getDb();
  db.report_recovery_attempts = db.report_recovery_attempts.filter(
    (r) => (r.created_at as string) >= cutoffIso
  );
}
