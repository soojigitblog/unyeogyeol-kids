"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

/** 홈(랜딩) 마운트 시 1회 이벤트만 쏘는 무자각 컴포넌트. */
export function LandingViewBeacon() {
  useEffect(() => {
    trackEvent("landing_view");
  }, []);
  return null;
}
