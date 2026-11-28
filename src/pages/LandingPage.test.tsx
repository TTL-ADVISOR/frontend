import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render'
import { loggedOut, server } from '../test/server'

describe('소개 화면', () => {
  it('로그인하지 않았으면 윗줄에 로그인, 첫 화면에 시작하기를 한 번씩 보여 주고, 시작하기는 회원가입으로 간다', async () => {
    server.use(loggedOut)
    const { router } = renderRoute('/')

    const header = await screen.findByRole('navigation', { name: '계정' })
    expect(await within(header).findByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('link', { name: /내 프로젝트로/ })).not.toBeInTheDocument()
    expect(within(header).queryByRole('link', { name: '시작하기' })).not.toBeInTheDocument()
    // 같은 버튼을 반복하지 않는다
    expect(screen.getAllByRole('link', { name: /시작하기|로그인/ })).toHaveLength(2)
    // 사이드바 없이 단독 화면으로 보여 준다
    expect(screen.queryByRole('complementary', { name: '사이드바' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: '시작하기' }))
    expect(await screen.findByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/signup')
  })

  it('예시 결과와 동작 방식을 보여 준다', async () => {
    server.use(loggedOut)
    renderRoute('/')

    expect(await screen.findByRole('img', { name: /추천 TTL은 1분/ })).toBeInTheDocument()
    const steps = within(screen.getByRole('region', { name: '이렇게 동작해요' })).getAllByRole('heading', { level: 3 })
    expect(steps.map((h) => h.textContent)).toEqual(['로그 올리기', '엔드포인트로 묶기', 'TTL마다 재생하기', '추천 받기'])
  })

  it('로그인했으면 내 프로젝트로 가는 버튼을 보여 준다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))
    const { router } = renderRoute('/')

    const header = await screen.findByRole('navigation', { name: '계정' })
    const toProjects = await within(header).findByRole('link', { name: '내 프로젝트로' })
    // 이미 가입했으니 시작하기·로그인은 보이지 않는다
    expect(screen.queryByRole('link', { name: /시작하기|로그인/ })).not.toBeInTheDocument()

    await userEvent.click(toProjects)
    expect(await screen.findByRole('heading', { name: '프로젝트' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/projects')
  })
})
