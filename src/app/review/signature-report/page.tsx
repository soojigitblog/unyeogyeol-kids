"use client";

import { Suspense } from "react";
import PaidSignatureReportPage from "@/app/paid/signature/page";

export default function ReviewSignatureReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-cocoa">리포트를 불러오는 중입니다...</div>}>
      <PaidSignatureReportPage />
    </Suspense>
  );
}
