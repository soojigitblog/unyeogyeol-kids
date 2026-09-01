import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMemorySupabaseClient, useMemoryCommerceStore } from "./memoryStore";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  if (useMemoryCommerceStore()) {
    adminClient = createMemorySupabaseClient();
    return adminClient;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_ENV_MISSING");
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** 테스트용 */
export function resetSupabaseAdminForTests(): void {
  adminClient = null;
}
