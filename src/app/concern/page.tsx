"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useKids } from "@/lib/store";
import { CONCERNS } from "@/lib/concerns";
import type { ConcernId } from "@/lib/types";

export default function ConcernPage() {
  const router = useRouter();
  const { child, concern, concernNote, setConcern, ready } = useKids();
  const [selected, setSelected] = useState<ConcernId | null>(concern);
  const [note, setNote] = useState(concernNote ?? "");

  useEffect(() => {
    if (ready && !child) router.replace("/free/child");
  }, [ready, child, router]);

  function handleNext() {
    if (!selected) return;
    setConcern(selected, selected === "etc" ? note.trim() : "");
    router.push("/products");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-12 pt-4">
        <Container>
          <div className="animate-rise">
            <p className="text-[13px] font-semibold text-coral-deep">지금 이야기</p>
            <h1 className="mt-2 text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              요즘 가장 힘든 순간은
              <br />
              언제인가요?
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-cocoa-soft">
              가장 마음이 쓰이는 순간 하나만 골라 주세요.
              <br />그 순간을 가장 먼저 살펴 드려요.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {CONCERNS.map((c) => {
              const active = selected === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`flex items-center gap-2 rounded-[1.05rem] border px-4 py-3.5 text-left text-[14.5px] font-medium transition-all active:scale-[0.99] ${
                    active
                      ? "border-coral bg-coral-tint text-cocoa"
                      : "border-line bg-card text-cocoa hover:border-coral-soft"
                  }`}
                >
                  <span aria-hidden className="text-[17px]">
                    {c.emoji}
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {selected === "etc" && (
            <div className="mt-4 animate-rise">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="요즘 가장 마음이 쓰이는 순간을 편하게 적어 주세요."
                rows={3}
                maxLength={200}
                className="w-full rounded-[1.05rem] border border-line bg-card px-4 py-3.5 text-[15.5px] text-cocoa placeholder:text-cocoa-faint focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15"
              />
            </div>
          )}

          <div className="mt-8">
            <Button size="lg" onClick={handleNext} disabled={!selected}>
              우리 아이 이야기 보기
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Button>
          </div>
        </Container>
      </main>
    </>
  );
}
