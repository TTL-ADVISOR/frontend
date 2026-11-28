import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { safeNextPath } from '../features/auth/validation'
import { renderRoute } from '../test/render'
import { loggedOut, server, testUser } from '../test/server'

const invalidCredentials = HttpResponse.json(
  { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.', details: {} },
  { status: 401 },
)

describe('로그인이 필요한 화면', () => {
  it('로그인하지 않았으면 로그인 화면으로 보내고, 돌아올 주소를 남긴다', async () => {
    server.use(loggedOut)
    const { router } = renderRoute('/projects/3')

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?next=%2Fprojects%2F3')
  })

  it('사용 중 세션이 만료되면(401 UNAUTHORIZED) 로그인 화면으로 보낸다', async () => {
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', details: {} }, { status: 401 }),
      ),
    )
    const { router } = renderRoute('/projects')

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('로그인', () => {
  it('성공하면 원래 가려던 화면으로 가고 헤더에 이름이 보인다', async () => {
    server.use(loggedOut)
    let body: unknown
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(testUser)
      }),
      http.get('/api/projects/3', () =>
        HttpResponse.json({ id: 3, name: '쇼핑몰', createdAt: testUser.createdAt, uploadCount: 0, latestAnalysisId: null }),
      ),
    )
    const { router } = renderRoute('/login?next=%2Fprojects%2F3')

    await userEvent.type(await screen.findByLabelText('이메일'), '  dev@example.com ')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'correct-horse-1')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/3'))
    expect(body).toEqual({ email: 'dev@example.com', password: 'correct-horse-1' })
    expect(await screen.findByText('박개발')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('실패하면 서버 메시지를 보여 주고 로그인 화면에 머문다', async () => {
    server.use(loggedOut, http.post('/api/auth/login', () => invalidCredentials))
    const { router } = renderRoute('/login')

    await userEvent.type(await screen.findByLabelText('이메일'), 'dev@example.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong-pass')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.')
    expect(router.state.location.pathname).toBe('/login')
  })

  it('빈 값은 보내지 않고 바로 알려 준다', async () => {
    let posts = 0
    server.use(
      loggedOut,
      http.post('/api/auth/login', () => {
        posts += 1
        return invalidCredentials
      }),
    )
    renderRoute('/login')

    await userEvent.click(await screen.findByRole('button', { name: '로그인' }))

    expect(screen.getByLabelText('이메일')).toHaveAccessibleDescription('이메일을 입력해 주세요.')
    expect(screen.getByLabelText('비밀번호')).toHaveAccessibleDescription('비밀번호를 입력해 주세요.')
    expect(posts).toBe(0)
  })

  it('비밀번호 보기 버튼으로 입력한 비밀번호를 보고 다시 숨긴다', async () => {
    server.use(loggedOut)
    renderRoute('/login')

    const password = await screen.findByLabelText('비밀번호')
    const reveal = screen.getByRole('button', { name: '비밀번호 보기' })
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(reveal)
    expect(password).toHaveAttribute('type', 'text')
    expect(reveal).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(reveal)
    expect(password).toHaveAttribute('type', 'password')
    // 오른쪽에는 장식 그림 대신 결과 예시를 보여 준다
    expect(screen.getByRole('complementary', { name: '분석 결과 예시' })).toHaveTextContent('추천 TTL')
  })

  it('이미 로그인했으면 로그인 화면 대신 프로젝트 목록으로 간다', async () => {
    server.use(http.get('/api/projects', () => HttpResponse.json([])))
    const { router } = renderRoute('/login')

    await waitFor(() => expect(router.state.location.pathname).toBe('/projects'))
  })

  it('소셜 로그인 실패 코드(?error=)를 안내한다', async () => {
    server.use(loggedOut)
    renderRoute('/login?error=EMAIL_ALREADY_REGISTERED')

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 이메일로 가입된 계정입니다')
  })
})

describe('회원가입', () => {
  async function fill(values: Partial<Record<string, string>>) {
    const labels: Record<string, string> = {
      name: '이름',
      email: '이메일',
      password: '비밀번호',
      passwordConfirm: '비밀번호 확인',
      company: '회사 (선택)',
    }
    for (const [field, value] of Object.entries(values)) {
      if (value) await userEvent.type(await screen.findByLabelText(labels[field]), value)
    }
  }

  it('가입하면 앞뒤 공백을 지워 보내고, 회사를 비우면 null로 보내고, 프로젝트 목록으로 간다', async () => {
    let body: unknown
    server.use(
      loggedOut,
      http.post('/api/auth/signup', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(testUser, { status: 201 })
      }),
      http.get('/api/projects', () => HttpResponse.json([])),
    )
    const { router } = renderRoute('/signup')

    await fill({ name: ' 박개발 ', email: ' dev@example.com ', password: 'correct-horse-1', passwordConfirm: 'correct-horse-1' })
    await userEvent.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/projects'))
    expect(body).toEqual({ name: '박개발', email: 'dev@example.com', password: 'correct-horse-1', company: null })
  })

  it('비밀번호 확인이 다르거나, 한글 비밀번호가 72바이트를 넘으면 보내지 않는다', async () => {
    let posts = 0
    server.use(
      loggedOut,
      http.post('/api/auth/signup', () => {
        posts += 1
        return HttpResponse.json(testUser, { status: 201 })
      }),
    )
    renderRoute('/signup')

    await fill({ name: '박개발', email: 'dev@example.com', password: 'correct-horse-1', passwordConfirm: 'correct-horse-2' })
    await userEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(screen.getByLabelText('비밀번호 확인')).toHaveAccessibleDescription('비밀번호가 일치하지 않습니다.')

    const password = screen.getByLabelText('비밀번호')
    await userEvent.clear(password)
    await userEvent.type(password, '가'.repeat(25))
    await userEvent.click(screen.getByRole('button', { name: '가입하기' }))
    expect(password).toHaveAccessibleDescription(/8~64자.*비밀번호가 너무 깁니다/)

    expect(posts).toBe(0)
  })

  it('이미 가입된 이메일(409)은 이메일 칸에 표시한다', async () => {
    server.use(
      loggedOut,
      http.post('/api/auth/signup', () =>
        HttpResponse.json(
          { code: 'EMAIL_ALREADY_EXISTS', message: '이미 가입된 이메일입니다.', details: {} },
          { status: 409 },
        ),
      ),
    )
    renderRoute('/signup')

    await fill({ name: '박개발', email: 'dev@example.com', password: 'correct-horse-1', passwordConfirm: 'correct-horse-1' })
    await userEvent.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() =>
      expect(screen.getByLabelText('이메일')).toHaveAccessibleDescription('이미 가입된 이메일입니다.'),
    )
  })
})

describe('로그아웃', () => {
  it('로그아웃하면 (돌아갈 주소 없이) 소개 화면으로 가고 계정 정보가 사라진다', async () => {
    let loggedIn = true
    server.use(
      http.get('/api/auth/me', () =>
        loggedIn
          ? HttpResponse.json(testUser)
          : HttpResponse.json({ code: 'UNAUTHORIZED', message: '', details: {} }, { status: 401 }),
      ),
      http.post('/api/auth/logout', () => {
        loggedIn = false
        return new HttpResponse(null, { status: 204 })
      }),
      http.get('/api/projects', () => HttpResponse.json([])),
    )
    const { router } = renderRoute('/projects')

    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('link', { name: '시작하기' })).toBeInTheDocument()
    // 직접 로그아웃하면 보던 화면으로 돌아오는 ?next=를 남기지 않는다
    await waitFor(() => expect(router.state.location.pathname + router.state.location.search).toBe('/'))
    expect(screen.queryByText('박개발')).not.toBeInTheDocument()
  })
})

describe('로그아웃 실패와 CSRF', () => {
  it('로그아웃 요청이 서버 오류로 실패하면 로그인 상태를 유지하고 실패를 알린다', async () => {
    server.use(
      http.post('/api/auth/logout', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', details: {} }, { status: 500 }),
      ),
      http.get('/api/projects', () => HttpResponse.json([])),
    )
    const { router } = renderRoute('/projects')

    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('로그아웃하지 못했습니다')
    expect(router.state.location.pathname).toBe('/projects')
    expect(screen.getByText('박개발')).toBeInTheDocument()
  })

  it('로그인 없이 쓰기 요청을 보내면 403(CSRF) → 토큰 재발급 → 401을 거쳐 로그인 화면으로 간다', async () => {
    let meCalls = 0
    server.use(
      // 처음 로그인 확인은 로그인 상태(화면 진입용), 이후 토큰 재발급 요청은 세션이 끝난 상태
      http.get('/api/auth/me', () => {
        meCalls += 1
        if (meCalls === 1) return HttpResponse.json(testUser)
        document.cookie = 'XSRF-TOKEN=fresh; path=/'
        return HttpResponse.json({ code: 'UNAUTHORIZED', message: '', details: {} }, { status: 401 })
      }),
      http.get('/api/projects', () => HttpResponse.json([])),
      http.post('/api/projects', ({ request }) =>
        request.headers.get('X-XSRF-TOKEN') === 'fresh'
          ? HttpResponse.json({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', details: {} }, { status: 401 })
          : HttpResponse.json({ code: 'CSRF_TOKEN_INVALID', message: '', details: {} }, { status: 403 }),
      ),
    )
    const { router } = renderRoute('/projects')

    await userEvent.type(await screen.findByLabelText('새 프로젝트'), '쇼핑몰')
    await userEvent.click(screen.getByRole('button', { name: '만들기' }))

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })
})

describe('safeNextPath', () => {
  it('같은 사이트 경로만 허용하고 나머지는 프로젝트 목록으로 바꾼다', () => {
    expect(safeNextPath('/projects/3?tab=a')).toBe('/projects/3?tab=a')
    expect(safeNextPath('//evil.example')).toBe('/projects')
    expect(safeNextPath('/\\evil.example')).toBe('/projects')
    expect(safeNextPath('https://evil.example')).toBe('/projects')
    expect(safeNextPath(null)).toBe('/projects')
  })
})
