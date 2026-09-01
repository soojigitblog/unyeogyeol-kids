// P2.4 시크릿 노출 방지 테스트 (§14 §32 §51 Security)
//
// 목적: Toss Secret Key / Supabase Service Role Key 가 브라우저로 나가는 코드에
//       섞이지 않는지, 그리고 LIVE 결제가 켜지지 않는지 소스 레벨에서 검증한다.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = join(process.cwd(), "src");

/** 서버에서만 읽어야 하는 환경변수 */
const SERVER_ONLY_ENV = [
  "TOSS_SECRET_KEY_TEST",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
];

function collectFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

/** "use client" 지시자가 있는 파일 = 브라우저 번들에 포함되는 파일 */
function isClientFile(content: string): boolean {
  const head = content.slice(0, 200);
  return head.includes('"use client"') || head.includes("'use client'");
}

describe("P2.4 시크릿 노출 방지", () => {
  const files = collectFiles(SRC_DIR, [".ts", ".tsx"]).filter(
    (f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx")
  );

  it("클라이언트 컴포넌트에서 서버 전용 환경변수를 읽지 않는다", () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      if (!isClientFile(content)) continue;
      for (const env of SERVER_ONLY_ENV) {
        if (content.includes(env)) {
          violations.push(`${file.replace(process.cwd(), "")} → ${env}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("서버 전용 환경변수는 NEXT_PUBLIC_ 접두사로 노출되지 않는다", () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const env of SERVER_ONLY_ENV) {
        if (content.includes(`NEXT_PUBLIC_${env}`)) {
          violations.push(`${file.replace(process.cwd(), "")} → NEXT_PUBLIC_${env}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it(".env.example 이 서버 전용 키를 NEXT_PUBLIC_ 으로 안내하지 않는다", () => {
    const envExample = join(process.cwd(), ".env.example");
    if (!existsSync(envExample)) return;
    const content = readFileSync(envExample, "utf-8");
    expect(content).not.toContain("NEXT_PUBLIC_TOSS_SECRET");
    expect(content).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("빌드 산출물(있을 경우)의 클라이언트 번들에 시크릿 값이 없다", () => {
    const staticDir = join(process.cwd(), ".next", "static");
    if (!existsSync(staticDir)) return; // 빌드 전이면 건너뜀

    const secretValues = SERVER_ONLY_ENV.map((k) => process.env[k]).filter(
      (v): v is string => Boolean(v && v.length >= 8)
    );
    if (secretValues.length === 0) return; // 로컬에 실제 키가 없으면 검사 대상 없음

    const bundles = collectFiles(staticDir, [".js"]);
    const leaked: string[] = [];
    for (const bundle of bundles) {
      const content = readFileSync(bundle, "utf-8");
      for (const secret of secretValues) {
        if (content.includes(secret)) {
          leaked.push(bundle.replace(process.cwd(), ""));
        }
      }
    }
    expect(leaked).toEqual([]);
  });

  it("LIVE 결제 모드는 코드 레벨에서 차단되어 있다", async () => {
    const original = process.env.PAYMENT_MODE;
    try {
      process.env.PAYMENT_MODE = "live";
      const { getPaymentMode, isLivePaymentEnabled } = await import(
        "@/lib/commerce/paymentMode"
      );
      expect(() => getPaymentMode()).toThrow(/LIVE/);
      expect(isLivePaymentEnabled()).toBe(false);
    } finally {
      process.env.PAYMENT_MODE = original ?? "mock";
    }
  });

  it("Toss 결제 승인은 서버 모듈에서만 호출된다", () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      if (!isClientFile(content)) continue;
      if (content.includes("api.tosspayments.com/v1/payments/confirm")) {
        violations.push(file.replace(process.cwd(), ""));
      }
    }
    expect(violations).toEqual([]);
  });
});
