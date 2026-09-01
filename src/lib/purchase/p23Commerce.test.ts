import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  buildSessionFingerprint,
  isLegacyMockPurchaseEnabled,
  SIGNATURE_PRODUCT_ID,
  SIGNATURE_PRICE_KRW,
} from "./commerce";
import {
  clearPurchaseState,
  completeMockSignaturePurchase,
  hasSignaturePurchase,
  listSavedResults,
  upsertSavedResult,
} from "./purchaseStore";
import { isSignatureSetupComplete } from "./setupGuard";
import { buildShareSummaryText, assertSharePrivacy } from "./sharePayload";
import { generateSignatureReport } from "../interaction/signatureReportGenerator";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildSleepEvidence } from "../questionnaire/sleepQuestions";

describe("P2.3 Commerce Mock", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
    };
    vi.stubGlobal("window", { localStorage: localStorageMock });
    vi.stubGlobal("localStorage", localStorageMock);
    clearPurchaseState();
  });

  it("Signature price is 12,900원", () => {
    expect(SIGNATURE_PRICE_KRW).toBe(12900);
  });

  it("Legacy mock purchase disabled by default", () => {
    expect(isLegacyMockPurchaseEnabled()).toBe(false);
  });

  it("Setup guard requires child, caregiver, conflict, concern", () => {
    expect(
      isSignatureSetupComplete({
        child: { name: "하람", birthDate: "2023-03-15", birthTimeKnown: false, gender: "girl" },
        caregiverProfile: {
          role: "father",
          roleLabel: "아빠",
          birthDate: "1990-05-20",
          birthTimeKnown: false,
        },
        momAnswers: { time_pressure_style: "opt_time_control", emotion_coping_style: "opt_emo_explain", instruction_resistance_style: "opt_inst_firm" },
        conflictInput: {
          concernId: "sleep",
          scenarioId: "sc_sleep_bedtime_delay",
          childFirstReaction: "test",
          momFirstReaction: "test",
          subsequentEscalation: "test",
          recentFrequency: "several_times_a_week",
        },
        concern: "sleep",
      })
    ).toBe(true);
  });

  it("Mock purchase + fingerprint guard", () => {
    const fp = buildSessionFingerprint({
      childName: "하람",
      childBirthDate: "2023-03-15",
      caregiverRoleLabel: "아빠",
      concernId: "sleep",
    });
    expect(hasSignaturePurchase(fp)).toBe(false);
    completeMockSignaturePurchase({
      resultId: "sig_test",
      childName: "하람",
      caregiverRoleLabel: "아빠",
      concernId: "sleep",
      sessionFingerprint: fp,
    });
    expect(hasSignaturePurchase(fp)).toBe(true);
  });

  it("My Results dedup by session fingerprint", () => {
    const fp = buildSessionFingerprint({
      childName: "하람",
      childBirthDate: "2023-03-15",
      caregiverRoleLabel: "아빠",
      concernId: "sleep",
    });
    upsertSavedResult({
      resultId: "sig_1",
      productId: SIGNATURE_PRODUCT_ID,
      childName: "하람",
      caregiverRoleLabel: "아빠",
      concernLabel: "수면/잠자리",
      concernId: "sleep",
      createdAt: "2026-09-01T00:00:00.000Z",
      sessionFingerprint: fp,
    });
    upsertSavedResult({
      resultId: "sig_2",
      productId: SIGNATURE_PRODUCT_ID,
      childName: "하람",
      caregiverRoleLabel: "아빠",
      concernLabel: "수면/잠자리",
      concernId: "sleep",
      createdAt: "2026-09-01T01:00:00.000Z",
      sessionFingerprint: fp,
    });
    const list = listSavedResults();
    expect(list.length).toBe(1);
    expect(list[0]?.resultId).toBe("sig_2");
  });

  it("Share payload privacy — no birth date or fortune facts", () => {
    const report = generateSignatureReport(
      { name: "하람", birthDate: "2023-03-15", birthTimeKnown: false, gender: "girl" },
      [
        ...buildBehaviorEvidence({ new_environment: 2, transition: 2, self_assertion: 2 }),
        ...buildSleepEvidence({
          bedtime_transition: "sleep_transition_needs_completion",
          routine_order: "sleep_routine_prefers_familiar_sequence",
          lights_off_departure: "sleep_separation_requests_presence",
          pre_sleep: "sleep_prebed_continues_activity",
        }),
      ],
      buildMomEvidence({
        time_pressure_style: "opt_time_control",
        emotion_coping_style: "opt_emo_explain",
        instruction_resistance_style: "opt_inst_firm",
        routine_flexibility_style: "opt_rout_replan",
        conflict_recovery_style: "opt_rec_repair",
      }),
      {
        concernId: "sleep",
        scenarioId: "sc_sleep_bedtime_delay",
        childFirstReaction: "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함",
        momFirstReaction: "'이제 자야 할 시간이야, 빨리 누워' 하고 재촉함",
        subsequentEscalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
        recentFrequency: "several_times_a_week",
        momTypicalPhrase: "이제 자야 할 시간이야, 빨리 누워",
      },
      null,
      { role: "father", roleLabel: "아빠", birthDate: "1990-05-20", birthTimeKnown: false }
    );
    const text = buildShareSummaryText(report);
    expect(assertSharePrivacy(text)).toBe(true);
    expect(text).not.toContain("Fixture");
    expect(text).not.toContain("1990");
    expect(text).not.toContain("2023-03-15");
  });
});
