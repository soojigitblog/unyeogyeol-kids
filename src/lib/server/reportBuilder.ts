import type {
  Answers,
  CaregiverProfile,
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  FoodMicroCheckAnswers,
  MomAnswers,
  SignatureReport,
  SleepMicroCheckAnswers,
} from "@/lib/types";
import { buildBehaviorEvidence } from "@/lib/questionnaire/evidence";
import { buildFoodEvidence } from "@/lib/questionnaire/foodQuestions";
import { buildSleepEvidence } from "@/lib/questionnaire/sleepQuestions";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { computeFortuneFacts } from "@/lib/fortune/engine";
import { generateSignatureReport } from "@/lib/interaction/signatureReportGenerator";
import { REPORT_VERSION, SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";

export interface SignaturePrepareInput {
  child: ChildProfile;
  answers: Answers;
  caregiverProfile: CaregiverProfile;
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput;
  concern: ConcernId;
  foodAnswers?: FoodMicroCheckAnswers;
  sleepAnswers?: SleepMicroCheckAnswers;
}

export function buildSignatureReportPayload(
  input: SignaturePrepareInput
): SignatureReport {
  let childEv = buildBehaviorEvidence(input.answers || {});
  if (input.foodAnswers && Object.keys(input.foodAnswers).length > 0) {
    childEv = [...childEv, ...buildFoodEvidence(input.foodAnswers)];
  }
  if (input.sleepAnswers && Object.keys(input.sleepAnswers).length > 0) {
    childEv = [...childEv, ...buildSleepEvidence(input.sleepAnswers)];
  }
  const momEv = buildMomEvidence(input.momAnswers || {});
  const fortune = input.child.birthDate
    ? computeFortuneFacts(
        input.child.birthDate,
        input.child.birthTimeKnown,
        input.child.birthTime
      )
    : null;

  return generateSignatureReport(
    input.child,
    childEv,
    momEv,
    input.conflictInput,
    fortune,
    input.caregiverProfile
  );
}

export function parseBirthTime(profile: {
  birthTimeKnown?: boolean;
  birthTime?: string;
}): string | null {
  if (!profile.birthTimeKnown || !profile.birthTime) return null;
  return profile.birthTime.length === 5 ? `${profile.birthTime}:00` : profile.birthTime;
}

export const SIGNATURE_PRODUCT = SIGNATURE_PRODUCT_ID;
export const SIGNATURE_REPORT_VERSION = REPORT_VERSION;
