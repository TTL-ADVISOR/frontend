import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { ApiError, apiFetch } from './client'

describe('apiFetch', () => {
  it('성공 응답의 JSON을 돌려준다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([{ id: 1, name: '상품 API' }])))

    await expect(apiFetch('/projects')).resolves.toEqual([{ id: 1, name: '상품 API' }])
  })

  it('객체 body는 JSON으로 보낸다', async () => {
    server.use(
      http.post('/api/projects', async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe('application/json')
        return HttpResponse.json(await request.json(), { status: 201 })
      }),
    )

    await expect(apiFetch('/projects', { method: 'POST', body: { name: 'a' } })).resolves.toEqual({ name: 'a' })
  })

  it('204는 undefined를 돌려준다', async () => {
    server.use(http.delete('/api/projects/1', () => new HttpResponse(null, { status: 204 })))

    await expect(apiFetch('/projects/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('에러 응답을 ApiError로 바꾼다', async () => {
    server.use(
      http.get('/api/uploads/12', () =>
        HttpResponse.json(
          { code: 'UPLOAD_NOT_PARSED', message: '파싱이 끝난 업로드만 분석할 수 있습니다.', details: { uploadId: 12 } },
          { status: 409 },
        ),
      ),
    )

    const error = await apiFetch('/uploads/12').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 409,
      code: 'UPLOAD_NOT_PARSED',
      message: '파싱이 끝난 업로드만 분석할 수 있습니다.',
      details: { uploadId: 12 },
      isClientError: true,
    })
  })

  it('JSON이 아닌 에러 응답은 UNKNOWN_ERROR가 된다', async () => {
    server.use(http.get('/api/projects', () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 })))

    await expect(apiFetch('/projects')).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN_ERROR',
      isClientError: false,
    })
  })

  it('서버에 닿지 못하면 NETWORK_ERROR(status 0)가 된다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.error()))

    await expect(apiFetch('/projects')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  describe('CSRF', () => {
    afterEach(() => {
      document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    })

    it('쓰기 요청에는 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 붙이고, 읽기 요청에는 붙이지 않는다', async () => {
      document.cookie = 'XSRF-TOKEN=token-1; path=/'
      const seen: Record<string, string | null> = {}
      server.use(
        http.get('/api/projects', ({ request }) => {
          seen.get = request.headers.get('X-XSRF-TOKEN')
          return HttpResponse.json([])
        }),
        http.post('/api/projects', ({ request }) => {
          seen.post = request.headers.get('X-XSRF-TOKEN')
          return HttpResponse.json({}, { status: 201 })
        }),
      )

      await apiFetch('/projects')
      await apiFetch('/projects', { method: 'POST', body: { name: 'a' } })

      expect(seen).toEqual({ get: null, post: 'token-1' })
    })

    it('CSRF 토큰이 거절되면 토큰을 다시 받아 한 번만 재시도한다', async () => {
      let posts = 0
      server.use(
        http.get('/api/auth/me', () => {
          document.cookie = 'XSRF-TOKEN=fresh; path=/'
          return HttpResponse.json({ code: 'UNAUTHORIZED', message: '', details: {} }, { status: 401 })
        }),
        http.post('/api/auth/login', ({ request }) => {
          posts += 1
          if (request.headers.get('X-XSRF-TOKEN') !== 'fresh') {
            return HttpResponse.json({ code: 'CSRF_TOKEN_INVALID', message: '', details: {} }, { status: 403 })
          }
          return HttpResponse.json({ id: 1 })
        }),
      )

      await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).resolves.toEqual({ id: 1 })
      expect(posts).toBe(2)
    })

    it('재시도해도 거절되면 더 시도하지 않고 오류를 낸다', async () => {
      let posts = 0
      server.use(
        http.post('/api/projects', () => {
          posts += 1
          return HttpResponse.json({ code: 'CSRF_TOKEN_INVALID', message: '거절', details: {} }, { status: 403 })
        }),
      )

      await expect(apiFetch('/projects', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 403 })
      expect(posts).toBe(2)
    })
  })
})
