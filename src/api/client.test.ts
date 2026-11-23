import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
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
})
