import { Link, Outlet } from 'react-router'
import { useLogout, useMe } from '../features/auth/queries'
import BrandMark from './BrandMark'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/projects" className="layout__brand">
          <BrandMark className="layout__brand-mark" />
          <span className="layout__brand-name">TTL Advisor</span>
        </Link>
        <AccountMenu />
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}

function AccountMenu() {
  const me = useMe()
  const logout = useLogout()
  if (!me.data) return null
  return (
    <div className="account">
      <span className="account__name" title={me.data.email}>
        {me.data.name}
      </span>
      <button type="button" className="button account__logout" onClick={() => logout.mutate()} disabled={logout.isPending}>
        {logout.isPending ? '로그아웃 중…' : '로그아웃'}
      </button>
    </div>
  )
}
