"use client";

import { ensureGuestSession, guestAuthHeaders } from "@/lib/commerce/guestSession";
import { SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";
import type { SignaturePrepareInput } from "@/lib/server/reportBuilder";

export async function apiPrepareSignature(input: SignaturePrepareInput) {
  const guest = await ensureGuestSession();
  const res = await fetch("/api/commerce/signature/prepare", {
    method: "POST",
    headers: guestAuthHeaders(guest),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "PREPARE_FAILED");
  }
  return res.json() as Promise<{ reportId: string; reportVersion: string }>;
}

export async function apiCreateOrder(reportId: string) {
  const guest = await ensureGuestSession();
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: guestAuthHeaders(guest),
    body: JSON.stringify({ productId: SIGNATURE_PRODUCT_ID, reportId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "ORDER_FAILED");
  }
  return res.json() as Promise<{
    orderId: string;
    amount: number;
    currency: string;
    reportId: string;
  }>;
}

export async function apiConfirmMockPayment(orderId: string, amount: number) {
  const guest = await ensureGuestSession();
  const res = await fetch("/api/payments/mock/confirm", {
    method: "POST",
    headers: guestAuthHeaders(guest),
    body: JSON.stringify({ orderId, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "CONFIRM_FAILED");
  }
  return res.json() as Promise<{
    status: "PAID";
    reportId: string;
    orderId: string;
    alreadyPaid: boolean;
  }>;
}

export async function apiConfirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
) {
  const guest = await ensureGuestSession();
  const res = await fetch("/api/payments/toss/confirm", {
    method: "POST",
    headers: guestAuthHeaders(guest),
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "CONFIRM_FAILED");
  }
  return res.json() as Promise<{
    status: "PAID";
    reportId: string;
    orderId: string;
    alreadyPaid: boolean;
  }>;
}

export async function apiCheckReportAccess(reportId: string) {
  const guest = await ensureGuestSession();
  const res = await fetch(`/api/reports/${reportId}/access`, {
    headers: guestAuthHeaders(guest),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.allowed);
}

export async function apiFetchReport(reportId: string) {
  const guest = await ensureGuestSession();
  const res = await fetch(`/api/reports/${reportId}`, {
    headers: guestAuthHeaders(guest),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.report;
}

export interface MyResultItem {
  reportId: string;
  childName: string;
  caregiverRoleLabel: string;
  concernLabel: string;
  productName: string;
  createdAt: string;
}

export async function apiListMyResults(): Promise<MyResultItem[]> {
  const guest = await ensureGuestSession();
  const res = await fetch("/api/my-results", {
    headers: guestAuthHeaders(guest),
  });
  if (!res.ok) {
    throw new Error("LIST_FAILED");
  }
  const data = await res.json();
  return data.results ?? [];
}

export async function apiMarkOrderFailed(orderId: string) {
  const guest = await ensureGuestSession();
  await fetch("/api/orders/fail", {
    method: "POST",
    headers: guestAuthHeaders(guest),
    body: JSON.stringify({ orderId }),
  });
}
