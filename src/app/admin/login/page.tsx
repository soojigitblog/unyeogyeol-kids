"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "로그인에 실패했어요.");
        setBusy(false);
        return;
      }
      router.replace("/admin/refund-requests");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-bold text-cocoa">관리자 로그인</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void submit()}
        placeholder="비밀번호"
        className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-sm"
        disabled={busy}
        autoFocus
      />
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      <Button className="mt-4 w-full" disabled={busy} onClick={() => void submit()}>
        {busy ? "확인 중..." : "로그인"}
      </Button>
    </div>
  );
}
