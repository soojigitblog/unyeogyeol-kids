"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiIssueRecoveryCode,
  RecoveryCodeAlreadyIssuedError,
} from "@/lib/commerce/apiClient";
import { recoveryCodeTabStore } from "@/lib/commerce/recoveryCodeStore";

type Phase = "idle" | "loading" | "code" | "lost" | "error";

/**
 * P3.2 §12~15: canonical owner 전용 "결과 보관 코드" 발급/표시 UI.
 *
 * - autoIssueOnMount=true (결제 성공 화면): sessionStorage에 코드가 없으면 자동으로
 *   1회 발급 시도 — 아직 아무 코드도 없는 최초 상태이므로 회전(rotate)이 아니라
 *   순수 신규 발급이라 자동 호출이 안전하다.
 * - autoIssueOnMount=false (My Results): 절대 자동 호출하지 않는다. 사용자가 트리거를
 *   눌러야만 조회를 시도하고, 그 결과가 "이미 발급됨(평문 유실)"이면 "새 보관 코드
 *   발급하기" 버튼을 명시적으로 눌러야만 rotate:true를 호출한다 — 새로고침/재방문 같은
 *   부수 효과로 기존 코드가 말없이 회전(=다른 기기 접근 상실)되는 사고를 막기 위함.
 */
export function RecoveryCodeManager({
  reportId,
  autoIssueOnMount,
}: {
  reportId: string;
  autoIssueOnMount: boolean;
}) {
  // sessionStorage에 이미 코드가 있으면 effect 없이 첫 렌더에서 바로 반영한다
  // (effect 안에서 setState를 직접 동기 호출하지 않기 위해 lazy initializer 사용).
  const [phase, setPhase] = useState<Phase>(() =>
    recoveryCodeTabStore(reportId).load() ? "code" : "idle"
  );
  const [code, setCode] = useState<string | null>(() => recoveryCodeTabStore(reportId).load());
  const [copied, setCopied] = useState(false);

  const attemptIssue = useCallback(
    async (rotate: boolean) => {
      setPhase("loading");
      try {
        const result = await apiIssueRecoveryCode(reportId, { rotate });
        recoveryCodeTabStore(reportId).save(result.recoveryCode);
        setCode(result.recoveryCode);
        setPhase("code");
      } catch (e) {
        if (e instanceof RecoveryCodeAlreadyIssuedError) {
          setPhase("lost");
        } else {
          setPhase("error");
        }
      }
    },
    [reportId]
  );

  useEffect(() => {
    // 캐시된 코드는 이미 위 lazy initializer에서 반영됐다 — 여기서는 캐시가 없을 때만
    // (최초 발급 컨텍스트에 한해) 발급을 시도한다. attemptIssue는 비동기라 그 안의
    // setState는 effect 본문 안에서 동기적으로 실행되지 않는다.
    if (!autoIssueOnMount) return;
    if (recoveryCodeTabStore(reportId).load()) return;
    // attemptIssue는 첫 줄에서 setPhase("loading")를 동기 호출한다 — effect 콜백
    // 자체의 동기 실행 프레임 안에서 setState가 일어나지 않도록 마이크로태스크로 미룬다.
    void Promise.resolve().then(() => attemptIssue(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCopy() {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={() => attemptIssue(false)}
        className="text-[13px] font-semibold text-coral-deep underline underline-offset-2"
      >
        결과 보관 코드 보기
      </button>
    );
  }

  if (phase === "loading") {
    return <p className="text-[13px] text-cocoa-soft">확인하고 있어요…</p>;
  }

  if (phase === "code" && code) {
    return (
      <div className="rounded-2xl bg-milk p-4">
        <p className="text-[12px] font-bold text-cocoa-soft">결과 보관 코드</p>
        <p className="mt-1 font-mono text-[19px] font-bold tracking-wider text-cocoa">
          {code}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="text-[12.5px] font-bold text-coral-deep underline underline-offset-2"
          >
            {copied ? "복사됐어요" : "코드 복사"}
          </button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-cocoa-soft">
          다른 기기에서 결과를 다시 찾을 때 사용할 수 있어요. 안전한 곳에 저장해 주세요.
        </p>
      </div>
    );
  }

  if (phase === "lost") {
    return (
      <div className="rounded-2xl bg-milk p-4">
        <p className="text-[13px] leading-relaxed text-cocoa">
          이미 결과 보관 코드가 발급되어 있어요.
          <br />
          보안상 기존 코드는 다시 표시할 수 없어요.
        </p>
        <button
          type="button"
          onClick={() => attemptIssue(true)}
          className="mt-3 text-[13px] font-bold text-coral-deep underline underline-offset-2"
        >
          새 보관 코드 발급하기
        </button>
        <p className="mt-2 text-[11.5px] leading-relaxed text-cocoa-soft">
          새로 발급하면 예전 코드와, 그 코드로 다른 기기에서 연결된 접근은 더 이상 쓸 수 없게 돼요.
        </p>
      </div>
    );
  }

  return (
    <p className="text-[13px] text-coral-deep">
      코드를 확인하지 못했어요. 잠시 후 다시 시도해주세요.
    </p>
  );
}
