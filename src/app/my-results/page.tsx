"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { apiListMyResults, type MyResultItem } from "@/lib/commerce/apiClient";
import { ensureGuestSession } from "@/lib/commerce/guestSession";

export default function MyResultsPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [savedResults, setSavedResults] = useState<MyResultItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        await ensureGuestSession();
        const results = await apiListMyResults();
        setSavedResults(results);
      } catch {
        setError(true);
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container wide>
          <h1 className="text-[24px] font-bold text-cocoa">내 결과</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-cocoa-soft">
            이 브라우저에서 구매한 결과를 다시 볼 수 있어요. 향후 계정/결과찾기 기능 전까지는
            다른 기기에서 자동으로 복구되지 않습니다.
          </p>

          {!ready ? (
            <p className="mt-8 text-[14px] text-cocoa-soft">불러오는 중…</p>
          ) : error ? (
            <Card className="mt-8 p-6 text-center lg:mx-auto lg:max-w-[460px]">
              <p className="text-[15px] text-cocoa">결과 목록을 불러오지 못했어요.</p>
              <p className="mt-1 text-[13px] text-cocoa-soft">잠시 후 다시 시도해주세요.</p>
            </Card>
          ) : savedResults.length === 0 ? (
            <Card className="mt-8 p-6 text-center lg:mx-auto lg:max-w-[460px]">
              <p className="text-[15px] text-cocoa">아직 저장된 관계 사용설명서가 없어요.</p>
              <div className="mt-4">
                <ButtonLink href="/products" variant="secondary">
                  우리 둘 이야기 시작하기
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <div className="mt-6 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
              {savedResults.map((item) => (
                <Card key={item.reportId} className="flex flex-col p-5">
                  <p className="text-[17px] font-bold text-cocoa">
                    {item.childName} × {item.caregiverRoleLabel}
                  </p>
                  <p className="mt-1 text-[14px] text-cocoa-soft">{item.concernLabel}</p>
                  <p className="mt-0.5 text-[13px] text-cocoa-faint">
                    관계 사용설명서 ·{" "}
                    {(item.createdAt ?? "").slice(0, 10).replace(/-/g, ".")}
                  </p>
                  <div className="mt-4 lg:mt-auto lg:pt-4">
                    <ButtonLink
                      href={`/paid/signature?reportId=${item.reportId}`}
                      size="md"
                      className="w-full"
                    >
                      다시 보기
                    </ButtonLink>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/products" className="text-[13px] font-medium text-cocoa-soft underline">
              상품 페이지로
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
