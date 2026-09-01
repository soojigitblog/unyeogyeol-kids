"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConcernId } from "@/lib/types";
import {
  completeMockSignaturePurchase,
  hasSignaturePurchase,
  listSavedResults,
  loadPurchaseState,
  upsertSavedResult,
  type SavedResultEntry,
} from "./purchaseStore";

export function usePurchase() {
  const [ready, setReady] = useState(false);
  const [savedResults, setSavedResults] = useState<SavedResultEntry[]>([]);

  const refresh = useCallback(() => {
    setSavedResults(listSavedResults());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkSignaturePurchase = useCallback((fingerprint: string) => {
    return hasSignaturePurchase(fingerprint);
  }, []);

  const purchaseSignature = useCallback(
    (params: {
      resultId: string;
      childName: string;
      caregiverRoleLabel: string;
      concernId: ConcernId;
      sessionFingerprint: string;
    }) => {
      completeMockSignaturePurchase(params);
      refresh();
    },
    [refresh]
  );

  const saveResult = useCallback(
    (entry: Omit<SavedResultEntry, "reportVersion">) => {
      const saved = upsertSavedResult(entry);
      refresh();
      return saved;
    },
    [refresh]
  );

  return {
    ready,
    savedResults,
    refresh,
    checkSignaturePurchase,
    purchaseSignature,
    saveResult,
    loadPurchaseState,
  };
}
