"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { apiListMyResults, type MyResultItem } from "@/lib/commerce/apiClient";
import { ensureGuestSession } from "@/lib/commerce/guestSession";
import { RecoveryCodeEntry } from "@/components/commerce/RecoveryCodeEntry";
import { RecoveryCodeManager } from "@/components/commerce/RecoveryCodeManager";
import { RefundRequestForm } from "@/components/commerce/RefundRequestForm";

export default function MyResultsPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [savedResults, setSavedResults] = useState<MyResultItem[]>([]);
  const [refundReportId, setRefundReportId] = useState<string | null>(null);

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
            이 브라우저에서 구매하거나 결과 보관 코드로 찾은 결과를 볼 수 있어요.
          </p>
          <div className="mt-3">
            <RecoveryCodeEntry />
          </div>

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
            <>
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
                    {item.canManageRecoveryCode && (
                      <div className="mt-3">
                        <RecoveryCodeManager reportId={item.reportId} autoIssueOnMount={false} />
                      </div>
                    )}
                    <div className="mt-4 flex flex-col gap-2 lg:mt-auto lg:pt-4">
                      <ButtonLink
                        href={`/paid/signature?reportId=${item.reportId}`}
                        size="md"
                        className="w-full"
                      >
                        다시 보기
                      </ButtonLink>
                      {item.canManageRecoveryCode && (
                        <Button
                          variant="secondary"
                          size="md"
                          className="w-full"
                          onClick={() => setRefundReportId(item.reportId)}
                        >
                          환불 신청
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <Card tone="sage" className="mt-6 p-5">
                <p className="text-[12.5px] font-semibold text-sage-deep">다시 살펴볼 때</p>
                <h2 className="mt-1.5 text-[18px] font-bold text-cocoa">
                  아이가 달라져서가 아니라, 장면이 달라졌을 때예요.
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-cocoa-soft">
                  새로운 갈등 장면이 생겼거나 같은 시도를 6~8주 해본 뒤에도 막히는 지점이 있다면,
                  그때의 상황과 반응으로 새 관계 사용설명서를 받아보세요.
                </p>
                <div className="mt-4">
                  <ButtonLink href="/free/child" variant="secondary">
                    새 장면으로 무료 진단 시작하기
                  </ButtonLink>
                </div>
              </Card>
            </>
          )}

          <div className="mt-8 text-center">
            <Link href="/products" className="text-[13px] font-medium text-cocoa-soft underline">
              상품 페이지로
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />

      {refundReportId ? (
        <RefundRequestForm
          reportId={refundReportId}
          onClose={() => setRefundReportId(null)}
        />
      ) : null}
    </>
  );
}
