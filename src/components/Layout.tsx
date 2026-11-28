import { useEffect, useRef, useState, type FocusEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router'
import { useLogout, useMe } from '../features/auth/queries'
import { useProject } from '../features/projects/queries'
import ToastProvider from '../features/toast/ToastProvider'
import BrandMark from './BrandMark'
import Icon, { type IconName } from './Icon'

const PINNED_KEY = 'ttl.sidebar.pinned'
/** 아이콘 줄에 마우스를 올린 뒤 펼쳐지기까지 기다리는 시간 (스쳐 지나갈 때 열리지 않게) */
const PEEK_DELAY_MS = 150

/**
 * 로그인 후 화면의 뼈대: 왼쪽 사이드바 + 본문.
 * - 넓은 화면: 사이드바 아이콘 버튼으로 "고정"을 켜고 끈다. 고정을 끄면 아이콘 줄만 남고,
 *   마우스를 올리거나 키보드로 들어가면 본문 위로 잠깐 펼쳐진다.
 * - 좁은 화면(900px 이하): 윗줄 메뉴 버튼으로 여닫는 서랍이 된다.
 */
export default function Layout() {
  const [pinned, setPinned] = useState(() => localStorage.getItem(PINNED_KEY) !== '0')
  const [peek, setPeek] = useState(false)
  const peekTimer = useRef<number | undefined>(undefined)
  const location = useLocation()
  // 서랍을 연 화면의 경로. 메뉴를 골라 화면이 바뀌면 경로가 달라져 저절로 닫힌다
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const drawerOpen = drawerPath === location.pathname
  const setDrawerOpen = (open: boolean) => setDrawerPath(open ? location.pathname : null)

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerPath(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  useEffect(() => () => window.clearTimeout(peekTimer.current), [])

  function togglePinned() {
    window.clearTimeout(peekTimer.current)
    setPeek(false)
    setPinned((value) => {
      localStorage.setItem(PINNED_KEY, value ? '0' : '1')
      return !value
    })
  }

  function startPeek() {
    if (pinned) return
    window.clearTimeout(peekTimer.current)
    peekTimer.current = window.setTimeout(() => setPeek(true), PEEK_DELAY_MS)
  }

  function endPeek() {
    window.clearTimeout(peekTimer.current)
    setPeek(false)
  }

  // 키보드로 사이드바 안에 들어오면 펼치고, 사이드바 밖으로 나가면 접는다
  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) endPeek()
  }

  const shellClass = [
    'shell',
    pinned ? 'shell--pinned' : 'shell--rail',
    peek && !pinned ? 'shell--peek' : '',
    drawerOpen ? 'shell--drawer-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ToastProvider>
      <div className={shellClass}>
        {/* 좁은 화면에서만 보이는 윗줄 */}
        <div className="shell__topbar">
          <button
            type="button"
            className="icon-button"
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen}
            aria-controls="sidebar"
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <Brand />
        </div>

        <aside
          id="sidebar"
          className="sidebar"
          aria-label="사이드바"
          onMouseEnter={startPeek}
          onMouseLeave={endPeek}
          onFocus={() => !pinned && setPeek(true)}
          onBlur={handleBlur}
        >
          <div className="sidebar__head">
            <Brand />
            <button
              type="button"
              className="icon-button sidebar__pin"
              aria-label="사이드바 고정"
              aria-pressed={pinned}
              title={pinned ? '사이드바 고정 해제' : '사이드바 고정'}
              onClick={togglePinned}
            >
              <Icon name="panel" />
            </button>
            <button
              type="button"
              className="icon-button sidebar__close"
              aria-label="메뉴 닫기"
              onClick={() => setDrawerOpen(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <Navigation />
          <div className="sidebar__foot">
            <Account />
          </div>
        </aside>
        <div className="shell__scrim" aria-hidden="true" onClick={() => setDrawerOpen(false)} />

        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  )
}

function Brand() {
  return (
    <Link to="/projects" className="brand">
      <BrandMark className="brand__mark" />
      <span className="brand__name">TTL Advisor</span>
    </Link>
  )
}

function Navigation() {
  const match = useMatch('/projects/:projectId/*')
  const projectId = match ? Number(match.params.projectId) : undefined

  return (
    <nav className="sidebar__nav" aria-label="주 메뉴">
      <NavItem to="/projects" icon="projects" label="프로젝트" end />
      {projectId !== undefined && Number.isFinite(projectId) && <ProjectNav projectId={projectId} />}
    </nav>
  )
}

/** 프로젝트 안에 있을 때만 보이는 그 프로젝트의 메뉴 */
function ProjectNav({ projectId }: { projectId: number }) {
  const project = useProject(projectId)
  if (!project.data) return null
  return (
    <div className="sidebar__group">
      <p className="sidebar__group-title" title={project.data.name}>
        {project.data.name}
      </p>
      <NavItem to={`/projects/${projectId}`} icon="overview" label="개요" end />
      <NavItem to={`/projects/${projectId}/logs`} icon="logs" label="로그" />
      <SoonItem icon="policy" label="정책" />
      <SoonItem icon="analysis" label="분석" />
      <NavItem to={`/projects/${projectId}/settings`} icon="settings" label="설정" />
    </div>
  )
}

function NavItem({ to, icon, label, end }: { to: string; icon: IconName; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className="sidebar__item" title={label}>
      <Icon name={icon} />
      <span className="sidebar__label">{label}</span>
    </NavLink>
  )
}

/** 아직 만들지 않은 메뉴. 자리만 보여 준다 */
function SoonItem({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className="sidebar__item sidebar__item--soon" aria-disabled="true" title={`${label} (준비 중)`}>
      <Icon name={icon} />
      <span className="sidebar__label">{label}</span>
      <span className="sidebar__soon">준비 중</span>
    </span>
  )
}

function Account() {
  const me = useMe()
  const logout = useLogout()
  if (!me.data) return null
  return (
    <div className="account">
      <div className="account__who" title={me.data.email}>
        <span className="account__avatar" aria-hidden="true">
          {me.data.name.slice(0, 1)}
        </span>
        <span className="account__text">
          <span className="account__name">{me.data.name}</span>
          <span className="account__email">{me.data.email}</span>
        </span>
      </div>
      {logout.isError && (
        <p role="alert" className="account__error">
          로그아웃하지 못했습니다. 다시 시도해 주세요.
        </p>
      )}
      <button
        type="button"
        className="sidebar__item"
        title="로그아웃"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <Icon name="logout" />
        <span className="sidebar__label">{logout.isPending ? '로그아웃 중…' : '로그아웃'}</span>
      </button>
    </div>
  )
}
