import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { ProjectSummary } from '../api/projects'
import type { UploadDetail, UploadSummary } from '../api/uploads'
import { server } from '../test/server'
import { renderRoute } from '../test/render'

const project: ProjectSummary = {
  id: 1,
  name: '상품 API',
  createdAt: '2026-11-23T10:00:00.000Z',
  uploadCount: 0,
  latestAnalysisId: null,
}

const upload = (over: Partial<UploadDetail>): UploadDetail => ({
  id: 12,
  projectId: 1,
  filename: 'access.jsonl',
  status: 'PARSED',
  processedLines: 400000,
  totalLines: 400000,
  errorLines: 0,
  rangeStart: '2026-11-22T00:00:00.012Z',
  rangeEnd: '2026-11-22T23:59:59.870Z',
  errorSamples: [],
  failureReason: null,
  createdAt: '2026-11-23T10:01:00.000Z',
  ...over,
})

const summaryOf = (detail: UploadDetail): UploadSummary => {
  const { errorSamples, ...rest } = detail
  void errorSamples
  return rest
}

const logFile = (name = 'access.jsonl', content = '{"ts":"2026-11-22T00:00:00Z"}\n') =>
  new File([content], name, { type: 'application/octet-stream' })

function withProject(uploads: UploadDetail[] = []) {
  server.use(
    http.get('/api/projects/1', () => HttpResponse.json(project)),
    http.get('/api/projects/1/uploads', () => HttpResponse.json(uploads.map(summaryOf))),
    ...uploads.map((item) => http.get(`/api/uploads/${item.id}`, () => HttpResponse.json(item))),
  )
}

const fileInput = () => screen.getByTestId('upload-input') as HTMLInputElement

describe('로그 업로드', () => {
  it('올린 로그가 없으면 빈 상태와 업로드 영역을 보여 준다', async () => {
    withProject()

    renderRoute('/projects/1')

    expect(await screen.findByText('아직 올린 로그가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '파일 선택' })).toHaveAccessibleDescription(/최대 100MB/)
  })

  it('파일을 고르면 올리고, 처리 중에는 처리한 줄 수를, 끝나면 결과를 보여 주고 이력을 갱신한다', async () => {
    let sentName: string | undefined
    let sentToken: string | null = null
    let detailCalls = 0
    let listAfterUpload = false
    const done = upload({ id: 30, status: 'PARSED', totalLines: 1234, processedLines: 1234, errorLines: 2 })
    document.cookie = 'XSRF-TOKEN=token-1'
    server.use(
      http.get('/api/projects/1', () => HttpResponse.json(project)),
      http.get('/api/projects/1/uploads', () => HttpResponse.json(listAfterUpload ? [summaryOf(done)] : [])),
      http.post('/api/projects/1/uploads', async ({ request }) => {
        sentToken = request.headers.get('X-XSRF-TOKEN')
        // jsdom의 multipart 본문은 formData()로 읽지 못해 본문 문자열에서 파일 이름을 찾는다
        sentName = /name="file"; filename="([^"]+)"/.exec(await request.text())?.[1]
        listAfterUpload = true
        return HttpResponse.json({ id: 30, status: 'UPLOADED' }, { status: 202 })
      }),
      http.get('/api/uploads/30', () => {
        detailCalls += 1
        return HttpResponse.json(
          detailCalls === 1
            ? upload({ ...done, status: 'PARSING', processedLines: 500, totalLines: null, rangeStart: null, rangeEnd: null })
            : done,
        )
      }),
    )

    renderRoute('/projects/1')
    await screen.findByText('아직 올린 로그가 없습니다')
    await userEvent.upload(fileInput(), logFile())

    const card = await screen.findByRole('article', { name: 'access.jsonl 처리 상태' })
    expect(await within(card).findByText('500줄 처리함')).toBeInTheDocument()
    expect(await within(card).findByText('1,234줄', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(within(card).getByText('완료')).toBeInTheDocument()
    expect(within(card).getByText('2줄')).toBeInTheDocument()
    expect(sentName).toBe('access.jsonl')
    expect(sentToken).toBe('token-1')

    const history = await screen.findByRole('list', { name: '업로드 이력' })
    expect(within(history).getByRole('button', { name: /access\.jsonl/ })).toHaveAttribute('aria-current', 'true')
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('파일을 끌어다 놓아도 올린다', async () => {
    let posted = false
    withProject()
    server.use(
      http.post('/api/projects/1/uploads', () => {
        posted = true
        return HttpResponse.json({ id: 31, status: 'UPLOADED' }, { status: 202 })
      }),
      http.get('/api/uploads/31', () => HttpResponse.json(upload({ id: 31, filename: 'drop.log' }))),
    )

    renderRoute('/projects/1')
    const zone = (await screen.findByText('로그 파일을 여기에 끌어다 놓으세요')).parentElement!
    fireEvent.drop(zone, { dataTransfer: { files: [logFile('drop.log')] } })

    expect(await screen.findByRole('article', { name: 'drop.log 처리 상태' })).toBeInTheDocument()
    expect(posted).toBe(true)
  })

  it('확장자가 맞지 않으면 보내지 않고 안내한다', async () => {
    let posted = false
    withProject()
    server.use(
      http.post('/api/projects/1/uploads', () => {
        posted = true
        return HttpResponse.json({}, { status: 202 })
      }),
    )

    renderRoute('/projects/1')
    await screen.findByText('아직 올린 로그가 없습니다')
    await userEvent.upload(fileInput(), logFile('access.csv'), { applyAccept: false })

    expect(screen.getByRole('alert')).toHaveTextContent('.jsonl, .log, .txt')
    expect(posted).toBe(false)
  })

  it('100MB를 넘으면 보내지 않고 안내한다', async () => {
    let posted = false
    withProject()
    server.use(
      http.post('/api/projects/1/uploads', () => {
        posted = true
        return HttpResponse.json({}, { status: 202 })
      }),
    )
    const big = logFile()
    Object.defineProperty(big, 'size', { value: 100 * 1024 * 1024 + 1 })

    renderRoute('/projects/1')
    await screen.findByText('아직 올린 로그가 없습니다')
    await userEvent.upload(fileInput(), big)

    expect(screen.getByRole('alert')).toHaveTextContent('100MB를 넘을 수 없습니다')
    expect(posted).toBe(false)
  })

  it('서버가 바빠서 거절하면(503) 다시 시도하라고 안내한다', async () => {
    withProject()
    server.use(
      http.post('/api/projects/1/uploads', () =>
        HttpResponse.json(
          { code: 'SERVER_BUSY', message: '처리 중인 작업이 많습니다. 잠시 후 다시 시도해 주세요.', details: {} },
          { status: 503 },
        ),
      ),
    )

    renderRoute('/projects/1')
    await screen.findByText('아직 올린 로그가 없습니다')
    await userEvent.upload(fileInput(), logFile())

    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 후 다시 시도해 주세요')
  })

  it('CSRF 토큰이 맞지 않으면 토큰을 새로 받아 한 번 다시 보낸다', async () => {
    let posts = 0
    let meCalls = 0
    withProject()
    server.use(
      http.get('/api/auth/me', () => {
        meCalls += 1
        return HttpResponse.json({ id: 1, name: '박개발', email: 'dev@example.com', company: null, createdAt: '' })
      }),
      http.post('/api/projects/1/uploads', () => {
        posts += 1
        return posts === 1
          ? HttpResponse.json({ code: 'CSRF_TOKEN_INVALID', message: 'x', details: {} }, { status: 403 })
          : HttpResponse.json({ id: 32, status: 'UPLOADED' }, { status: 202 })
      }),
      http.get('/api/uploads/32', () => HttpResponse.json(upload({ id: 32 }))),
    )

    renderRoute('/projects/1')
    await screen.findByText('아직 올린 로그가 없습니다')
    const before = meCalls
    await userEvent.upload(fileInput(), logFile())

    expect(await screen.findByRole('article', { name: 'access.jsonl 처리 상태' })).toBeInTheDocument()
    expect(posts).toBe(2)
    expect(meCalls).toBe(before + 1)
  })

  it('실패한 업로드는 사유, 형식 안내, 실패한 줄을 보여 준다', async () => {
    withProject([
      upload({
        status: 'FAILED',
        totalLines: null,
        rangeStart: null,
        rangeEnd: null,
        processedLines: 1000,
        errorLines: 1000,
        failureReason: 'JSON Lines 형식이 아닙니다',
        errorSamples: [
          { line: 1, reason: 'JSON 파싱 실패' },
          { line: 2, reason: 'ts 필드 누락' },
        ],
      }),
    ])

    renderRoute('/projects/1')

    const card = await screen.findByRole('article', { name: 'access.jsonl 처리 상태' })
    expect(within(card).getByRole('alert')).toHaveTextContent('JSON Lines 형식이 아닙니다')
    await userEvent.click(within(card).getByText(/실패한 줄 보기 \(2개 \/ 전체 1,000줄\)/))
    const rows = within(card).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('JSON 파싱 실패')
    expect(rows[2]).toHaveTextContent('ts 필드 누락')
  })

  it('이력에서 다른 업로드를 누르면 그 업로드의 상태를 보여 준다', async () => {
    withProject([upload({ id: 2, filename: 'new.jsonl' }), upload({ id: 1, filename: 'old.jsonl', totalLines: 77 })])

    renderRoute('/projects/1')

    // 처음에는 가장 최근 업로드
    expect(await screen.findByRole('article', { name: 'new.jsonl 처리 상태' })).toBeInTheDocument()
    const history = screen.getByRole('list', { name: '업로드 이력' })
    await userEvent.click(within(history).getByRole('button', { name: /old\.jsonl/ }))

    const card = await screen.findByRole('article', { name: 'old.jsonl 처리 상태' })
    expect(within(card).getByText('77줄')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(history).getByRole('button', { name: /old\.jsonl/ })).toHaveAttribute('aria-current', 'true'),
    )
  })
})
