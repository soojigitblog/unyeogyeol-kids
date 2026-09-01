"use client";

// 클라이언트 세션 스토어 (P1: 백엔드 없이 localStorage 로 흐름 유지)
// child-profile / answers / concern 을 단계 간에 전달한다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Answers,
  CaregiverProfile,
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  FoodMicroCheckAnswers,
  MomAnswers,
  SleepMicroCheckAnswers,
} from "@/lib/types";
import { migrateLegacyMomProfile } from "@/lib/caregiver";
import {
  createLocalSessionStore,
  type SessionStore,
} from "@/lib/storage/sessionStore";

interface KidsState {
  child: ChildProfile | null;
  answers: Answers;
  concern: ConcernId | null;
  concernNote: string;
  /** P2.2V.6: 엄마 고정(momProfile) -> 보호자/가족 관계 일반화. */
  caregiverProfile: CaregiverProfile | null;
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput | null;
  foodAnswers?: FoodMicroCheckAnswers;
  sleepAnswers?: SleepMicroCheckAnswers;
}

/** 레거시 개발 세션(momProfile) 호환용 저장 형태. */
type StoredKidsState = KidsState & {
  momProfile?: {
    name?: string;
    birthDate?: string;
    birthTimeKnown?: boolean;
    birthTime?: string;
  } | null;
};

interface KidsContextValue extends KidsState {
  ready: boolean;
  setChild: (child: ChildProfile) => void;
  setAnswer: (domain: keyof Answers, value: 1 | 2 | 3 | 4) => void;
  setConcern: (concern: ConcernId, note?: string) => void;
  setCaregiverProfile: (caregiver: CaregiverProfile) => void;
  setMomAnswer: (domain: string, optionId: string) => void;
  setConflictInput: (conflict: CurrentConflictInput) => void;
  setFoodAnswer: (questionId: keyof FoodMicroCheckAnswers, value: string) => void;
  setSleepAnswer: (
    questionId: keyof SleepMicroCheckAnswers,
    value: SleepMicroCheckAnswers[keyof SleepMicroCheckAnswers]
  ) => void;
  reset: () => void;
}

const STORAGE_KEY = "uyk_session_v1";

const emptyState: KidsState = {
  child: null,
  answers: {},
  concern: null,
  concernNote: "",
  caregiverProfile: null,
  momAnswers: {},
  conflictInput: null,
  foodAnswers: {},
  sleepAnswers: {},
};

const KidsContext = createContext<KidsContextValue | null>(null);

const store: SessionStore<StoredKidsState> =
  createLocalSessionStore<StoredKidsState>(STORAGE_KEY);

export function KidsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KidsState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = store.load();
    if (loaded) {
      const { momProfile: legacyMom, ...rest } = loaded;
      const merged: KidsState = { ...emptyState, ...rest };
      // 레거시 세션 마이그레이션: momProfile -> caregiverProfile(role="mother")
      if (!merged.caregiverProfile && legacyMom) {
        merged.caregiverProfile = migrateLegacyMomProfile(legacyMom);
      }
      setState(merged);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    store.save(state);
  }, [state, ready]);

  const setChild = useCallback((child: ChildProfile) => {
    setState((s) => ({ ...s, child }));
  }, []);

  const setAnswer = useCallback(
    (domain: keyof Answers, value: 1 | 2 | 3 | 4) => {
      setState((s) => ({ ...s, answers: { ...s.answers, [domain]: value } }));
    },
    [],
  );

  const setConcern = useCallback((concern: ConcernId, note = "") => {
    setState((s) => ({ ...s, concern, concernNote: note }));
  }, []);

  const setCaregiverProfile = useCallback((caregiverProfile: CaregiverProfile) => {
    setState((s) => ({ ...s, caregiverProfile }));
  }, []);

  const setMomAnswer = useCallback((domain: string, optionId: string) => {
    setState((s) => ({
      ...s,
      momAnswers: { ...s.momAnswers, [domain]: optionId },
    }));
  }, []);

  const setConflictInput = useCallback((conflictInput: CurrentConflictInput) => {
    setState((s) => ({ ...s, conflictInput }));
  }, []);

  const setFoodAnswer = useCallback((questionId: keyof FoodMicroCheckAnswers, value: string) => {
    setState((s) => ({
      ...s,
      foodAnswers: { ...s.foodAnswers, [questionId]: value },
    }));
  }, []);

  const setSleepAnswer = useCallback(
    (
      questionId: keyof SleepMicroCheckAnswers,
      value: SleepMicroCheckAnswers[keyof SleepMicroCheckAnswers]
    ) => {
    setState((s) => ({
      ...s,
      sleepAnswers: { ...s.sleepAnswers, [questionId]: value },
    }));
  },
    []
  );

  const reset = useCallback(() => {
    setState(emptyState);
    store.clear();
  }, []);

  const value = useMemo<KidsContextValue>(
    () => ({
      ...state,
      ready,
      setChild,
      setAnswer,
      setConcern,
      setCaregiverProfile,
      setMomAnswer,
      setConflictInput,
      setFoodAnswer,
      setSleepAnswer,
      reset,
    }),
    [
      state,
      ready,
      setChild,
      setAnswer,
      setConcern,
      setCaregiverProfile,
      setMomAnswer,
      setConflictInput,
      setFoodAnswer,
      setSleepAnswer,
      reset,
    ],
  );

  return <KidsContext.Provider value={value}>{children}</KidsContext.Provider>;
}

export function useKids(): KidsContextValue {
  const ctx = useContext(KidsContext);
  if (!ctx) throw new Error("useKids must be used within KidsProvider");
  return ctx;
}
