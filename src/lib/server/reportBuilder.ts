import type {
  Answers,
  BehaviorEvidence,
  CaregiverProfile,
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  FoodMicroCheckAnswers,
  FortuneFacts,
  MomAnswers,
  MomEvidence,
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

export interface EvidenceBundle {
  childEv: BehaviorEvidence[];
  momEv: MomEvidence[];
  fortune: FortuneFacts | null;
}

/**
 * P3.4: prepareSignatureReport(무료 단계)와 generatePaidExtras(결제 확인 단계)가
 * 공유하는 evidence 빌드 로직. 둘 다 이 함수를 호출해야 두 경로의 evidence가
 * 어긋나지 않는다.
 */
export function buildEvidenceBundle(
  input: Pick<
    SignaturePrepareInput,
    "child" | "answers" | "momAnswers" | "foodAnswers" | "sleepAnswers"
  >
): EvidenceBundle {
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

  return { childEv, momEv, fortune };
}

export function buildSignatureReportPayload(
  input: SignaturePrepareInput
): SignatureReport {
  const { childEv, momEv, fortune } = buildEvidenceBundle(input);

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
