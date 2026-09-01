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
