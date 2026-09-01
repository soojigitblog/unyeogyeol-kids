import { createLocalSessionStore } from "@/lib/storage/sessionStore";
import type { ConcernId } from "@/lib/types";
import {
  REPORT_VERSION,
  SIGNATURE_PRODUCT_ID,
  type SignatureProductId,
} from "./commerce";

export interface MockSignaturePurchase {
  productId: SignatureProductId;
  mockPaid: true;
  purchasedAt: string;
  resultId: string;
  childName: string;
  caregiverRoleLabel: string;
  concernId: ConcernId;
  sessionFingerprint: string;
}

export interface SavedResultEntry {
  resultId: string;
  productId: SignatureProductId;
  childName: string;
  caregiverRoleLabel: string;
  concernLabel: string;
  concernId: ConcernId;
  createdAt: string;
  sessionFingerprint: string;
  reportVersion: string;
}

export interface PurchaseState {
  signaturePurchase: MockSignaturePurchase | null;
  savedResults: SavedResultEntry[];
}

const STORAGE_KEY = "uyk_purchase_v1";

const emptyState: PurchaseState = {
  signaturePurchase: null,
  savedResults: [],
};

const store = createLocalSessionStore<PurchaseState>(STORAGE_KEY);

export function loadPurchaseState(): PurchaseState {
  return store.load() ?? { ...emptyState };
}

export function savePurchaseState(state: PurchaseState): void {
  store.save(state);
}

export function clearPurchaseState(): void {
  store.clear();
}

export function hasSignaturePurchase(fingerprint: string): boolean {
  const state = loadPurchaseState();
  return (
    state.signaturePurchase?.mockPaid === true &&
    state.signaturePurchase.sessionFingerprint === fingerprint
  );
}

export function completeMockSignaturePurchase(params: {
  resultId: string;
  childName: string;
  caregiverRoleLabel: string;
  concernId: ConcernId;
  sessionFingerprint: string;
}): MockSignaturePurchase {
  const purchase: MockSignaturePurchase = {
    productId: SIGNATURE_PRODUCT_ID,
    mockPaid: true,
    purchasedAt: new Date().toISOString(),
    resultId: params.resultId,
    childName: params.childName,
    caregiverRoleLabel: params.caregiverRoleLabel,
    concernId: params.concernId,
    sessionFingerprint: params.sessionFingerprint,
  };
  const state = loadPurchaseState();
  state.signaturePurchase = purchase;
  savePurchaseState(state);
  return purchase;
}

export function upsertSavedResult(entry: Omit<SavedResultEntry, "reportVersion">): SavedResultEntry {
  const full: SavedResultEntry = { ...entry, reportVersion: REPORT_VERSION };
  const state = loadPurchaseState();
  const idx = state.savedResults.findIndex(
    (r) => r.sessionFingerprint === full.sessionFingerprint && r.productId === full.productId
  );
  if (idx >= 0) {
    state.savedResults[idx] = full;
  } else {
    state.savedResults.unshift(full);
  }
  savePurchaseState(state);
  return full;
}

export function listSavedResults(): SavedResultEntry[] {
  return loadPurchaseState().savedResults;
}
