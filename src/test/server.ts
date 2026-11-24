import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { User } from '../api/auth'

export const testUser: User = {
  id: 1,
  name: '박개발',
  email: 'dev@example.com',
  company: null,
  createdAt: '2026-11-24T10:00:00.000Z',
}

/** 로그인하지 않은 상태로 만든다 (기본은 로그인 상태). */
export const loggedOut = http.get('/api/auth/me', () =>
  HttpResponse.json({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', details: {} }, { status: 401 }),
)

/**
 * 기본 핸들러: 로그인한 사용자. 테스트별로 server.use(...)로 덮어쓴다.
 * resetHandlers()는 이 기본값으로 돌아간다.
 */
export const server = setupServer(http.get('/api/auth/me', () => HttpResponse.json(testUser)))
