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
