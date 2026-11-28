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

  it('로그 형식, 설정 예시, 자주 묻는 질문을 보여 주고 탭으로 바꿔 본다', async () => {
    server.use(loggedOut)
    renderRoute('/')

    const format = await screen.findByRole('region', { name: '로그 형식' })
    expect(within(format).getAllByRole('row').map((row) => row.querySelector('th')?.textContent).slice(1)).toEqual([
      'ts',
      'method',
      'path',
      'status',
      'latencyMs',
      'size',
      'respHash',
    ])

    const config = screen.getByRole('region', { name: '추천을 설정으로' })
    expect(within(config).getByRole('tab', { name: 'Redis' })).toHaveAttribute('aria-selected', 'true')
    expect(within(config).getByRole('tabpanel')).toHaveTextContent('EX 60')
    await userEvent.click(within(config).getByRole('tab', { name: 'HTTP 헤더' }))
    expect(within(config).getByRole('tabpanel')).toHaveTextContent('Cache-Control: public, max-age=60')
    // 화살표로도 옮긴다
    await userEvent.keyboard('{ArrowLeft}')
    expect(within(config).getByRole('tab', { name: 'Spring Cache' })).toHaveFocus()
    expect(within(config).getByRole('tabpanel')).toHaveTextContent('entryTtl(Duration.ofSeconds(60))')

    const faq = screen.getByRole('region', { name: '자주 묻는 질문' })
    expect(within(faq).getByText('respHash가 없으면 어떻게 되나요?')).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: '바닥글' })).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/TTL-ADVISOR',
    )
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
