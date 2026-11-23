import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render'

describe('routes', () => {
  it('루트는 프로젝트 목록으로 이동한다', async () => {
    const { router } = renderRoute('/')

    expect(await screen.findByRole('heading', { name: '프로젝트' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/projects')
  })

  it('공통 레이아웃에 홈 링크가 있다', async () => {
    renderRoute('/projects')

    expect(await screen.findByRole('link', { name: 'TTL Advisor' })).toHaveAttribute('href', '/projects')
  })

  it('없는 경로는 404 화면을 보여 준다', async () => {
    renderRoute('/nope')

    expect(await screen.findByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeInTheDocument()
  })
})
