import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router'
import { useLogout, useMe } from '../features/auth/queries'
import { useProject } from '../features/projects/queries'
import BrandMark from './BrandMark'
import Icon, { type IconName } from './Icon'

const COLLAPSED_KEY = 'ttl.sidebar.collapsed'

/**
 * 로그인 후 화면의 뼈대: 왼쪽 사이드바 + 본문.
 * 넓은 화면에서는 사이드바를 아이콘만 남기고 접을 수 있고, 좁은 화면에서는 메뉴 버튼으로 여닫는 서랍이 된다.
 */
export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')
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

  function toggleCollapsed() {
    setCollapsed((value) => {
      localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1')
      return !value
    })
  }

  return (
    <div className={`shell${collapsed ? ' shell--collapsed' : ''}${drawerOpen ? ' shell--drawer-open' : ''}`}>
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

      <aside id="sidebar" className="sidebar" aria-label="사이드바">
        <div className="sidebar__head">
          <Brand />
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
          <button
            type="button"
            className="sidebar__item sidebar__collapse"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            onClick={toggleCollapsed}
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} />
            <span className="sidebar__label">접기</span>
          </button>
        </div>
      </aside>
      <div className="shell__scrim" aria-hidden="true" onClick={() => setDrawerOpen(false)} />

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
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
      <NavItem to={`/projects/${projectId}`} icon="upload" label="로그 업로드" end />
      <SoonItem icon="policy" label="엔드포인트 정책" />
      <SoonItem icon="analysis" label="분석 결과" />
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
