import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { ProjectSummary } from '../api/projects'
import { server } from '../test/server'
import { renderRoute } from '../test/render'

const summary = (over: Partial<ProjectSummary>): ProjectSummary => ({
  id: 1,
  name: '상품 API',
  createdAt: '2026-11-23T10:00:00.000Z',
  uploadCount: 0,
  latestAnalysisId: null,
  ...over,
})

describe('프로젝트 목록 화면', () => {
  it('목록을 불러오는 동안 로딩을 보여 주고, 불러오면 프로젝트를 보여 준다', async () => {
    server.use(
      http.get('/api/projects', async () => {
        await delay(20)
        return HttpResponse.json([
          summary({ id: 2, name: '주문 API', uploadCount: 3, latestAnalysisId: 7 }),
          summary({ id: 1, name: '상품 API' }),
        ])
      }),
    )

    renderRoute('/projects')

    // 로그인 확인이 끝난 뒤 목록을 불러오는 동안의 표시
    expect((await screen.findByText('프로젝트를 불러오는 중…')).closest('[role="status"]')).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: '프로젝트 목록' })
    // 머리글 줄을 뺀 프로젝트 줄. 기본은 최근 만든 순
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByRole('link', { name: '주문 API' })).toHaveAttribute('href', '/projects/2')
    expect(rows[0]).toHaveTextContent('분석 있음')
    expect(rows[0]).toHaveTextContent('3개')
    expect(rows[1]).toHaveTextContent('로그 필요')
  })

  it('이름으로 찾고, 이름순으로 정렬한다', async () => {
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json([
          summary({ id: 3, name: '결제 API', createdAt: '2026-11-25T00:00:00.000Z', uploadCount: 1 }),
          summary({ id: 2, name: '주문 API', createdAt: '2026-11-24T00:00:00.000Z' }),
          summary({ id: 1, name: '가격 API', createdAt: '2026-11-23T00:00:00.000Z' }),
        ]),
      ),
    )

    renderRoute('/projects')
    const table = await screen.findByRole('table', { name: '프로젝트 목록' })
    const names = () => within(table).getAllByRole('link').map((link) => link.textContent)
    expect(names()).toEqual(['결제 API', '주문 API', '가격 API'])
    expect(within(table).getByRole('link', { name: '결제 API' }).closest('tr')).toHaveTextContent('분석 전')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: '정렬' }), '이름순')
    expect(names()).toEqual(['가격 API', '결제 API', '주문 API'])

    await userEvent.type(screen.getByRole('searchbox', { name: '프로젝트 검색' }), '주문')
    expect(names()).toEqual(['주문 API'])

    await userEvent.clear(screen.getByRole('searchbox', { name: '프로젝트 검색' }))
    await userEvent.type(screen.getByRole('searchbox', { name: '프로젝트 검색' }), '배송')
    expect(screen.queryByRole('table', { name: '프로젝트 목록' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('‘배송’와 맞는 프로젝트가 없어요.')
  })

  it('프로젝트가 없으면 빈 상태를 안내한다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))

    renderRoute('/projects')

    expect(await screen.findByText('아직 프로젝트가 없습니다')).toBeInTheDocument()
  })

  it('불러오기에 실패하면 에러와 다시 시도 버튼을 보여 주고, 다시 시도하면 목록을 보여 준다', async () => {
    let calls = 0
    server.use(
      http.get('/api/projects', () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', details: {} }, { status: 500 })
          : HttpResponse.json([summary({})])
      }),
    )

    renderRoute('/projects')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('서버 오류가 발생했습니다.')
    await userEvent.click(within(alert).getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('link', { name: '상품 API' })).toBeInTheDocument()
  })
})

describe('프로젝트 생성', () => {
  it('이름을 입력해 만들면 공백을 잘라 보내고 프로젝트 화면으로 이동한다', async () => {
    let sentBody: unknown
    server.use(
      http.get('/api/projects', () => HttpResponse.json([])),
      http.post('/api/projects', async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ id: 5, name: '결제 API', createdAt: '2026-11-24T01:00:00.000Z' }, { status: 201 })
      }),
      http.get('/api/projects/5', () => HttpResponse.json(summary({ id: 5, name: '결제 API' }))),
      http.get('/api/projects/5/uploads', () => HttpResponse.json([])),
    )

    const { router } = renderRoute('/projects')
    await userEvent.type(await screen.findByLabelText('새 프로젝트'), '  결제 API  ')
    await userEvent.click(screen.getByRole('button', { name: '만들기' }))

    expect(await screen.findByRole('heading', { name: '결제 API' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/projects/5')
    expect(sentBody).toEqual({ name: '결제 API' })
  })

  it('이름이 비어 있으면 요청을 보내지 않고 안내한다', async () => {
    let posted = false
    server.use(
      http.get('/api/projects', () => HttpResponse.json([])),
      http.post('/api/projects', () => {
        posted = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    renderRoute('/projects')
    await userEvent.type(await screen.findByLabelText('새 프로젝트'), '   ')
    await userEvent.click(screen.getByRole('button', { name: '만들기' }))

    expect(screen.getByText('이름을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.getByLabelText('새 프로젝트')).toHaveAttribute('aria-invalid', 'true')
    expect(posted).toBe(false)
  })

  it('입력창 설명으로 프로젝트가 서비스 단위임을 알려 주고, 오류가 나면 오류도 함께 연결한다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))

    renderRoute('/projects')
    const input = await screen.findByLabelText('새 프로젝트')
    expect(input).toHaveAccessibleDescription(/서비스\(서버\) 하나당 프로젝트 하나예요/)

    await userEvent.click(screen.getByRole('button', { name: '만들기' }))
    expect(input).toHaveAccessibleDescription(/프로젝트 하나예요.*\S/)
    expect(input.getAttribute('aria-describedby')).toBe('project-name-hint project-name-error')
  })

  it('서버 검증 오류는 필드 사유를 보여 준다', async () => {
    server.use(
      http.get('/api/projects', () => HttpResponse.json([])),
      http.post('/api/projects', () =>
        HttpResponse.json(
          { code: 'INVALID_REQUEST', message: '요청 값이 올바르지 않습니다.', details: { name: '이미 쓰는 이름입니다.' } },
          { status: 400 },
        ),
      ),
    )

    renderRoute('/projects')
    await userEvent.type(await screen.findByLabelText('새 프로젝트'), '상품 API')
    await userEvent.click(screen.getByRole('button', { name: '만들기' }))

    expect(await screen.findByText('이미 쓰는 이름입니다.')).toBeInTheDocument()
  })

  it('요청 중에는 버튼을 막아 두 번 만들지 않는다', async () => {
    let posts = 0
    server.use(
      http.get('/api/projects', () => HttpResponse.json([])),
      http.post('/api/projects', async () => {
        posts += 1
        await delay(50)
        return HttpResponse.json({ id: 9, name: 'a', createdAt: '2026-11-24T01:00:00.000Z' }, { status: 201 })
      }),
      http.get('/api/projects/9', () => HttpResponse.json(summary({ id: 9, name: 'a' }))),
      http.get('/api/projects/9/uploads', () => HttpResponse.json([])),
    )

    renderRoute('/projects')
    await userEvent.type(await screen.findByLabelText('새 프로젝트'), 'a')
    await userEvent.click(screen.getByRole('button', { name: '만들기' }))

    const pending = screen.getByRole('button', { name: '만드는 중…' })
    expect(pending).toBeDisabled()
    await userEvent.click(pending)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'a' })).toBeInTheDocument())
    expect(posts).toBe(1)
  })
})

describe('프로젝트 화면', () => {
  it('없는 프로젝트면 안내와 목록 링크를 보여 준다', async () => {
    server.use(
      http.get('/api/projects/404', () =>
        HttpResponse.json({ code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.', details: {} }, { status: 404 }),
      ),
    )

    renderRoute('/projects/404')

    expect(await screen.findByRole('heading', { name: '프로젝트를 찾을 수 없습니다' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '프로젝트 목록으로' })).toBeInTheDocument()
  })
})
