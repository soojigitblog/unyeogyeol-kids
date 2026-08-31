"use client";

import { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
  AtSign,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareText: string;
  shareUrl?: string;
}

function InstagramIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  shareText,
  shareUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  const fullShareText = `${shareText}\n\n👉 우리 아이 기질 알아보기: ${currentUrl}`;

  // 1. 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 2. 전체 문구 + 링크 복사
  const handleCopyAll = () => {
    navigator.clipboard?.writeText(fullShareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 3. 카카오톡 공유 (웹 클라이언트 딥링크 / API fallback)
  const handleKakaoShare = () => {
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(
      currentUrl
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(kakaoUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  // 4. 스레드 (Threads) 공유
  const handleThreadsShare = () => {
    const text = encodeURIComponent(fullShareText);
    const threadsUrl = `https://threads.net/intent/post?text=${text}`;
    window.open(threadsUrl, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  // 5. 인스타그램 (인스타 스토리/피드는 텍스트 복사 후 인스타 이동 안내)
  const handleInstagramShare = () => {
    navigator.clipboard?.writeText(fullShareText).then(() => {
      alert("결과 문구가 복사되었어요! 인스타그램 스토리나 피드에 붙여넣어 공유해 보세요.");
      window.open("https://instagram.com", "_blank", "noopener,noreferrer");
    });
  };

  // 6. X (트위터) 공유
  const handleTwitterShare = () => {
    const text = encodeURIComponent(fullShareText);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa/40 backdrop-blur-sm sm:items-center p-0 sm:p-4">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div className="relative w-full max-w-[420px] rounded-t-[2rem] sm:rounded-[1.75rem] border border-line bg-card p-6 shadow-lift animate-rise z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line-soft">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-coral-tint text-coral-deep">
              <Share2 className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <h3 className="text-[17px] font-bold text-cocoa">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-cocoa-faint hover:bg-milk hover:text-cocoa transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* SNS Share Channels Grid */}
        <div className="mt-5 grid grid-cols-4 gap-3 text-center">
          {/* 카카오톡 */}
          <button
            type="button"
            onClick={handleKakaoShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="grid h-13 w-13 place-items-center rounded-2xl bg-[#FEE500] text-[#391B1B] shadow-sm transition-transform group-active:scale-95 group-hover:shadow-md">
              <MessageCircle className="h-6 w-6 fill-current" />
            </div>
            <span className="text-[12.5px] font-medium text-cocoa-soft">
              카카오톡
            </span>
          </button>

          {/* 인스타그램 */}
          <button
            type="button"
            onClick={handleInstagramShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-sm transition-transform group-active:scale-95 group-hover:shadow-md">
              <InstagramIcon className="h-6 w-6" />
            </div>
            <span className="text-[12.5px] font-medium text-cocoa-soft">
              인스타그램
            </span>
          </button>

          {/* 스레드 (Threads) */}
          <button
            type="button"
            onClick={handleThreadsShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="grid h-13 w-13 place-items-center rounded-2xl bg-cocoa text-milk shadow-sm transition-transform group-active:scale-95 group-hover:shadow-md">
              <AtSign className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <span className="text-[12.5px] font-medium text-cocoa-soft">
              스레드
            </span>
          </button>

          {/* X / 트위터 */}
          <button
            type="button"
            onClick={handleTwitterShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="grid h-13 w-13 place-items-center rounded-2xl bg-cocoa text-white shadow-sm transition-transform group-active:scale-95 group-hover:shadow-md">
              <Send className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span className="text-[12.5px] font-medium text-cocoa-soft">
              X (트위터)
            </span>
          </button>
        </div>

        {/* 링크 복사 Section */}
        <div className="mt-6 rounded-2xl border border-line bg-milk p-3.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-cocoa-soft flex-1 pl-1 select-all">
            {currentUrl}
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-coral-tint px-3 py-2 text-[13px] font-semibold text-coral-deep hover:bg-coral-soft transition-colors active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> 복사됨
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={2.2} /> 링크 복사
              </>
            )}
          </button>
        </div>

        {/* 전체 문구 복사 버튼 */}
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={handleCopyAll}
            className="w-full text-[14px]"
          >
            <Copy className="h-4 w-4" strokeWidth={2.2} /> 결과 문구 전체 복사하기
          </Button>
        </div>

        <p className="mt-4 text-center text-[12px] text-cocoa-faint">
          생년월일이나 개인정보는 공유 링크/문구에 포함되지 않아요.
        </p>
      </div>
    </div>
  );
}
