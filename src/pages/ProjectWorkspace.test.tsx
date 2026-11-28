import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { ProjectSummary } from '../api/projects'
import type { UploadSummary } from '../api/uploads'
import { server } from '../test/server'
import { renderRoute } from '../test/render'

const project: ProjectSummary = {
  id: 1,
  name: '상품 API',
  createdAt: '2026-11-23T10:00:00.000Z',
  uploadCount: 2,
  latestAnalysisId: null,
}

const upload = (over: Partial<UploadSummary>): UploadSummary => ({
  id: 10,
  projectId: 1,
  filename: 'access.jsonl',
  status: 'PARSED',
  processedLines: 1000,
  totalLines: 1000,
  errorLines: 0,
  rangeStart: '2026-11-22T00:00:00.000Z',
  rangeEnd: '2026-11-22T12:00:00.000Z',
  failureReason: null,
  createdAt: '2026-11-23T10:01:00.000Z',
  ...over,
})

function withProject(uploads: UploadSummary[]) {
  server.use(
    http.get('/api/projects/1', () => HttpResponse.json({ ...project, uploadCount: uploads.length })),
    http.get('/api/projects/1/uploads', () => HttpResponse.json(uploads)),
  )
}

describe('프로젝트 개요', () => {
  it('로그가 없으면 빈 숫자 대신 처음 할 일을 단계로 보여 준다', async () => {
    withProject([])
    renderRoute('/projects/1')

    const steps = await screen.findByRole('region', { name: '시작하기' })
    expect(
      within(steps)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['로그 올리기', '정책 정하기 (선택)', '분석 실행'])
    expect(within(steps).getByRole('link', { name: '로그 올리기' })).toHaveAttribute('href', '/projects/1/logs')
    expect(screen.queryByRole('definition')).not.toBeInTheDocument()
  })

  it('올린 로그를 요약하고, 읽지 못한 줄이 있으면 다음 할 일로 알려 준다', async () => {
    withProject([
      upload({ id: 11, filename: 'b.jsonl', totalLines: 500, errorLines: 3, rangeEnd: '2026-11-22T18:00:00.000Z' }),
      upload({ id: 10, filename: 'a.jsonl', totalLines: 1000, errorLines: 0 }),
    ])
    renderRoute('/projects/1')

    const summary = (await screen.findByText('읽은 요청')).closest('dl')!
    expect(summary).toHaveAttribute('aria-label', '올린 로그 요약')
    expect(within(summary).getByText('읽은 요청').nextElementSibling).toHaveTextContent('1,497')
    expect(within(summary).getByText('읽지 못한 줄').nextElementSibling).toHaveTextContent('3')
    expect(screen.getByText(/읽지 못한 줄이 3줄 있어요/)).toBeInTheDocument()
    const recent = screen.getByRole('table')
    expect(
      within(recent)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['b.jsonl', 'a.jsonl'])
  })

  it('최근 업로드가 실패했으면 사유를 확인하러 가게 한다', async () => {
    withProject([upload({ id: 12, filename: 'bad.log', status: 'FAILED', failureReason: '형식 오류' }), upload({})])
    renderRoute('/projects/1')

    expect(await screen.findByRole('link', { name: '사유 확인하기' })).toHaveAttribute('href', '/projects/1/logs')
    expect(screen.getByText(/bad\.log을\(를\) 처리하지 못했어요/)).toBeInTheDocument()
  })
})

describe('프로젝트 설정', () => {
  it('이름을 그대로 입력해야 지울 수 있고, 지우면 목록으로 간다', async () => {
    let deleted = false
    withProject([])
    server.use(
      http.delete('/api/projects/1', () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
      http.get('/api/projects', () => HttpResponse.json([])),
    )
    const { router } = renderRoute('/projects/1/settings')

    const button = await screen.findByRole('button', { name: '프로젝트 삭제' })
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/입력하세요/), '상품')
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/입력하세요/), ' API')
    await userEvent.click(button)

    expect(await screen.findByRole('heading', { name: '프로젝트' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/projects')
    expect(deleted).toBe(true)
    expect(
      within(screen.getByRole('region', { name: '알림' })).getByText('상품 API 프로젝트를 지웠어요.'),
    ).toBeInTheDocument()
  })

  it('처리 중인 작업이 있어 거절되면(409) 이유를 알려 준다', async () => {
    withProject([])
    server.use(
      http.delete('/api/projects/1', () =>
        HttpResponse.json({ code: 'RESOURCE_BUSY', message: 'busy', details: {} }, { status: 409 }),
      ),
    )
    renderRoute('/projects/1/settings')

    await userEvent.type(await screen.findByLabelText(/입력하세요/), '상품 API')
    await userEvent.click(screen.getByRole('button', { name: '프로젝트 삭제' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('처리 중인 업로드나 분석이 있어서')
  })
})
