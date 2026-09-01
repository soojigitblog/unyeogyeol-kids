"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** @deprecated P2.4 — /payment/success 로 이동 */
export default function LegacyCheckoutSuccessRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/payment/success");
  }, [router]);
  return null;
}
