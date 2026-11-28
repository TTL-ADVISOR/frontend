import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { renderRoute } from '../test/render'

const project = { id: 3, name: '주문 API', createdAt: '2026-11-23T10:00:00.000Z', uploadCount: 0, latestAnalysisId: null }

afterEach(() => localStorage.clear())

describe('사이드바', () => {
  it('프로젝트 목록에서는 프로젝트 메뉴가 현재 위치로 표시되고, 계정 정보가 보인다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))

    renderRoute('/projects')

    const nav = await screen.findByRole('navigation', { name: '주 메뉴' })
    expect(within(nav).getByRole('link', { name: '프로젝트' })).toHaveAttribute('aria-current', 'page')
    const sidebar = screen.getByRole('complementary', { name: '사이드바' })
    expect(await within(sidebar).findByText('박개발')).toBeInTheDocument()
    expect(within(sidebar).getByText('dev@example.com')).toBeInTheDocument()
  })

  it('프로젝트 안에서는 그 프로젝트 이름과 하위 메뉴를 보여 준다', async () => {
    server.use(
      http.get('/api/projects/3', () => HttpResponse.json(project)),
      http.get('/api/projects/3/uploads', () => HttpResponse.json([])),
    )

    renderRoute('/projects/3')

    const nav = await screen.findByRole('navigation', { name: '주 메뉴' })
    expect(await within(nav).findByText('주문 API')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: '로그 업로드' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: '프로젝트' })).not.toHaveAttribute('aria-current')
    // 아직 없는 메뉴는 링크가 아니다
    expect(within(nav).queryByRole('link', { name: /엔드포인트 정책/ })).not.toBeInTheDocument()
    expect(within(nav).getByText('엔드포인트 정책').closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true')
  })

  it('사이드바를 접으면 다음에 열어도 접힌 상태를 기억한다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))

    const first = renderRoute('/projects')
    await userEvent.click(await screen.findByRole('button', { name: '사이드바 접기' }))
    expect(screen.getByRole('button', { name: '사이드바 펼치기' })).toBeInTheDocument()
    first.unmount()

    renderRoute('/projects')
    expect(await screen.findByRole('button', { name: '사이드바 펼치기' })).toBeInTheDocument()
  })

  it('좁은 화면용 메뉴 버튼으로 서랍을 열고, 닫기·Esc·메뉴 이동으로 닫는다', async () => {
    server.use(
      http.get('/api/projects', () => HttpResponse.json([project])),
      http.get('/api/projects/3', () => HttpResponse.json(project)),
      http.get('/api/projects/3/uploads', () => HttpResponse.json([])),
    )

    renderRoute('/projects/3')
    const open = await screen.findByRole('button', { name: '메뉴 열기' })

    await userEvent.click(open)
    expect(open).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))
    expect(open).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(open)
    await userEvent.keyboard('{Escape}')
    expect(open).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(open)
    const nav = screen.getByRole('navigation', { name: '주 메뉴' })
    await userEvent.click(within(nav).getByRole('link', { name: '프로젝트' }))
    expect(await screen.findByRole('heading', { name: '프로젝트' })).toBeInTheDocument()
    expect(open).toHaveAttribute('aria-expanded', 'false')
  })
})
