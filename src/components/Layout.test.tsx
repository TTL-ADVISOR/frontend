import { screen, waitFor, within } from '@testing-library/react'
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
    expect(within(nav).getByRole('link', { name: '개요' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: '로그' })).toHaveAttribute('href', '/projects/3/logs')
    expect(within(nav).getByRole('link', { name: '설정' })).toHaveAttribute('href', '/projects/3/settings')
    expect(within(nav).getByRole('link', { name: '프로젝트' })).not.toHaveAttribute('aria-current')
    // 아직 없는 메뉴는 링크가 아니다
    expect(within(nav).queryByRole('link', { name: /정책/ })).not.toBeInTheDocument()
    expect(within(nav).getByText('정책').closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true')
  })

  it('고정 버튼을 끄면 아이콘 줄만 남고, 다음에 열어도 그 상태를 기억한다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))

    const first = renderRoute('/projects')
    const pin = await screen.findByRole('button', { name: '사이드바 고정' })
    // 처음에는 고정된 상태
    expect(pin).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(pin)
    expect(pin).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('.shell')).toHaveClass('shell--rail')
    first.unmount()

    renderRoute('/projects')
    expect(await screen.findByRole('button', { name: '사이드바 고정' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('고정을 끈 상태에서 마우스를 올리면 잠깐 펼치고, 벗어나면 다시 접는다', async () => {
    localStorage.setItem('ttl.sidebar.pinned', '0')
    server.use(http.get('/api/projects', () => HttpResponse.json([])))

    renderRoute('/projects')
    const sidebar = await screen.findByRole('complementary', { name: '사이드바' })
    const shell = document.querySelector('.shell')!

    await userEvent.hover(sidebar)
    await waitFor(() => expect(shell).toHaveClass('shell--peek'))
    await userEvent.unhover(sidebar)
    expect(shell).not.toHaveClass('shell--peek')

    // 펼쳐 본 상태에서 고정하면 그대로 고정된다
    await userEvent.hover(sidebar)
    await waitFor(() => expect(shell).toHaveClass('shell--peek'))
    await userEvent.click(screen.getByRole('button', { name: '사이드바 고정' }))
    expect(shell).toHaveClass('shell--pinned')
    expect(shell).not.toHaveClass('shell--peek')
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
