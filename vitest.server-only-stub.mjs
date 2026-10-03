// Vitest에는 Next.js 웹팩처럼 "서버 번들이면 no-op, 클라이언트 번들이면 throw"로
// server-only를 바꿔치기하는 로직이 없다. 유닛 테스트는 전부 서버 코드만 실행하므로
// 언제나 no-op으로 취급한다(Next.js가 실제 서버 빌드에서 하는 것과 동일한 효과).
export {};
