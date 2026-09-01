"use client";

import { createLocalSessionStore } from "@/lib/storage/sessionStore";

export interface CommerceDraftState {
  reportId: string | null;
  orderId: string | null;
  amount: number | null;
}

const STORAGE_KEY = "uyk_commerce_draft_v1";
const store = createLocalSessionStore<CommerceDraftState>(STORAGE_KEY);

const empty: CommerceDraftState = {
  reportId: null,
  orderId: null,
  amount: null,
};

export function loadCommerceDraft(): CommerceDraftState {
  return store.load() ?? { ...empty };
}

export function saveCommerceDraft(state: Partial<CommerceDraftState>): void {
  const current = loadCommerceDraft();
  store.save({ ...current, ...state });
}

export function clearCommerceDraft(): void {
  store.clear();
}
