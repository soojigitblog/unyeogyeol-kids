import "server-only";

/**
 * Payment must be explicitly enabled.  `disabled` is deliberately the
 * default so a newly deployed environment can never unlock a paid report
 * through the local mock flow.
 */
export type PaymentMode = "disabled" | "mock" | "toss_test" | "live";

export function getPaymentMode(): PaymentMode {
  const mode = (process.env.PAYMENT_MODE ?? "disabled") as PaymentMode;
  if (mode !== "disabled" && mode !== "mock" && mode !== "toss_test" && mode !== "live") {
    throw new Error(`Invalid PAYMENT_MODE: ${mode}`);
  }
  return mode;
}

export function isLivePaymentEnabled(): boolean {
  return getPaymentMode() === "live";
}

export function isTossTestMode(): boolean {
  return getPaymentMode() === "toss_test";
}

export function isMockPaymentMode(): boolean {
  // Mock confirmation is a development/CI convenience only.  A production
  // deploy must never turn a report into PAID without a processor response.
  return getPaymentMode() === "mock" && process.env.NODE_ENV !== "production";
}

export function isPaymentCheckoutEnabled(): boolean {
  const mode = getPaymentMode();
  return mode === "live" || mode === "toss_test" || isMockPaymentMode();
}

export function getTossClientKey(): string | null {
  if (isLivePaymentEnabled()) {
    return process.env.TOSS_CLIENT_KEY_LIVE ?? process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? null;
  }
  return process.env.TOSS_CLIENT_KEY_TEST ?? process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY_TEST ?? null;
}

export function getTossSecretKey(): string | null {
  return isLivePaymentEnabled()
    ? process.env.TOSS_SECRET_KEY_LIVE ?? null
    : process.env.TOSS_SECRET_KEY_TEST ?? null;
}

export function assertPaymentEnv(): void {
  const mode = getPaymentMode();
  if (mode === "toss_test" || mode === "live") {
    if (!getTossClientKey() || !getTossSecretKey()) {
      throw new Error("TOSS_TEST_KEYS_MISSING");
    }
  }
  if (process.env.COMMERCE_STORE === "memory") return;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_ENV_MISSING");
  }
}
