# TTL Advisor — Frontend

TTL Advisor 웹 클라이언트입니다. API 명세는 [backend/docs/API.md](https://github.com/TTL-ADVISOR/backend/blob/main/docs/API.md)를 참고하세요.

Stack: React 19 · TypeScript · Vite · React Router · TanStack Query · Recharts
Test: Vitest · React Testing Library · MSW

## 로컬 실행

백엔드를 먼저 띄웁니다 ([backend README](https://github.com/TTL-ADVISOR/backend#readme)).

```bash
npm install
npm run dev
```

http://localhost:5173 에서 열립니다. `/api` 요청은 개발 서버가 백엔드(기본 `http://localhost:8080`)로 넘깁니다.
다른 주소를 쓰려면 `.env.local`에 `VITE_API_PROXY_TARGET=http://localhost:9090`처럼 지정합니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm test` | 테스트 (Vitest, MSW로 API 모킹) |
| `npm run build` | 타입 검사 후 빌드 |
| `npm run lint` | oxlint |

## 구조

```
src/
  api/         API 클라이언트(apiFetch, ApiError)와 공통 타입
  app/         App, 라우트, QueryClient 설정
  components/  공통 컴포넌트 (Layout)
  pages/       화면
  test/        테스트 설정 (MSW 서버, 렌더 헬퍼)
```
