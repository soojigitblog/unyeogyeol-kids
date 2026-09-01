import type {
  CaregiverProfile,
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  MomAnswers,
} from "@/lib/types";

export function isSignatureSetupComplete(state: {
  child: ChildProfile | null;
  caregiverProfile: CaregiverProfile | null;
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput | null;
  concern: ConcernId | null;
}): boolean {
  if (!state.child?.birthDate) return false;
  if (!state.concern) return false;
  if (
    !state.caregiverProfile?.birthDate ||
    !state.caregiverProfile.role ||
    !state.caregiverProfile.roleLabel
  ) {
    return false;
  }
  if (!state.conflictInput?.scenarioId) return false;
  if (Object.keys(state.momAnswers || {}).length < 3) return false;
  return true;
}
