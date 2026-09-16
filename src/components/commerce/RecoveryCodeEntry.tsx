"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiRecoverByCode } from "@/lib/commerce/apiClient";

// P3.2 §11/§19: 새 기기(브라우저)에서 결과 보관 코드로 접근 권한을 복구하는 입력 UI.
export function RecoveryCodeEntry({ onRecovered }: { onRecovered?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { reportId } = await apiRecoverByCode(value);
      onRecovered?.();
      router.push(`/paid/signature?reportId=${reportId}`);
    } catch {
      setError("결과 보관 코드를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold text-coral-deep underline underline-offset-2"
      >
        다른 기기에서 산 결과 찾기
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-milk p-4">
      <label htmlFor="recovery-code-input" className="text-[12.5px] font-bold text-cocoa-soft">
        결과 보관 코드
      </label>
      <input
        id="recovery-code-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="XXXX-XXXX-XXXX"
        autoCapitalize="characters"
        className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 font-mono text-[15px] tracking-wider text-cocoa outline-none focus:border-coral-soft"
      />
      {error && <p className="mt-2 text-[12.5px] text-coral-deep">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="md" disabled={loading || !value.trim()}>
          {loading ? "확인하는 중…" : "결과 찾기"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
    </form>
  );
}
