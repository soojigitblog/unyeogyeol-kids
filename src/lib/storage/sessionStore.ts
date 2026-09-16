// storage 추상화 레이어
// P1: localStorage 구현만 사용한다. 향후 Supabase/DB 등으로 교체할 때
// 이 인터페이스만 구현하면 상위 코드(스토어)는 바뀌지 않는다.

export interface SessionStore<T> {
  load(): T | null;
  save(value: T): void;
  clear(): void;
}

/** 브라우저 localStorage 기반 구현. SSR/미지원 환경에서는 안전하게 no-op. */
export function createLocalSessionStore<T>(key: string): SessionStore<T> {
  const available = () =>
    typeof window !== "undefined" && !!window.localStorage;

  return {
    load() {
      if (!available()) return null;
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    save(value: T) {
      if (!available()) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // quota/직렬화 오류 무시
      }
    },
    clear() {
      if (!available()) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * 브라우저 sessionStorage 기반 구현(탭 생존 동안만 유지, 탭 종료 시 소멸).
 * P3.2 Guest Recovery: 결제 성공 시 1회 노출되는 평문 recovery code처럼, "새로고침에는
 * 살아남지만 탭을 닫으면 사라져야 하는" 값에 사용한다 — localStorage처럼 영구 보관되면
 * 안 되는 값이라 별도 구현으로 둔다.
 */
export function createTabSessionStore<T>(key: string): SessionStore<T> {
  const available = () =>
    typeof window !== "undefined" && !!window.sessionStorage;

  return {
    load() {
      if (!available()) return null;
      try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    save(value: T) {
      if (!available()) return;
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // quota/직렬화 오류 무시
      }
    },
    clear() {
      if (!available()) return;
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
