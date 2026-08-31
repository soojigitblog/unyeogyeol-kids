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
  ChildProfile,
  ConcernId,
  CurrentConflictInput,
  FoodMicroCheckAnswers,
  MomAnswers,
  MomProfile,
} from "@/lib/types";
import {
  createLocalSessionStore,
  type SessionStore,
} from "@/lib/storage/sessionStore";

interface KidsState {
  child: ChildProfile | null;
  answers: Answers;
  concern: ConcernId | null;
  concernNote: string;
  momProfile: MomProfile | null;
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput | null;
  foodAnswers?: FoodMicroCheckAnswers;
}

interface KidsContextValue extends KidsState {
  ready: boolean;
  setChild: (child: ChildProfile) => void;
  setAnswer: (domain: keyof Answers, value: 1 | 2 | 3 | 4) => void;
  setConcern: (concern: ConcernId, note?: string) => void;
  setMomProfile: (mom: MomProfile) => void;
  setMomAnswer: (domain: string, optionId: string) => void;
  setConflictInput: (conflict: CurrentConflictInput) => void;
  setFoodAnswer: (questionId: keyof FoodMicroCheckAnswers, value: any) => void;
  reset: () => void;
}

const STORAGE_KEY = "uyk_session_v1";

const emptyState: KidsState = {
  child: null,
  answers: {},
  concern: null,
  concernNote: "",
  momProfile: null,
  momAnswers: {},
  conflictInput: null,
  foodAnswers: {},
};

const KidsContext = createContext<KidsContextValue | null>(null);

const store: SessionStore<KidsState> =
  createLocalSessionStore<KidsState>(STORAGE_KEY);

export function KidsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KidsState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = store.load();
    if (loaded) setState({ ...emptyState, ...loaded });
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

  const setMomProfile = useCallback((momProfile: MomProfile) => {
    setState((s) => ({ ...s, momProfile }));
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

  const setFoodAnswer = useCallback((questionId: keyof FoodMicroCheckAnswers, value: any) => {
    setState((s) => ({
      ...s,
      foodAnswers: { ...s.foodAnswers, [questionId]: value },
    }));
  }, []);

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
      setMomProfile,
      setMomAnswer,
      setConflictInput,
      setFoodAnswer,
      reset,
    }),
    [
      state,
      ready,
      setChild,
      setAnswer,
      setConcern,
      setMomProfile,
      setMomAnswer,
      setConflictInput,
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
