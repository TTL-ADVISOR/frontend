import { Link, Outlet } from 'react-router'
import BrandMark from './BrandMark'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/projects" className="layout__brand">
          <BrandMark className="layout__brand-mark" />
          <span className="layout__brand-name">TTL Advisor</span>
        </Link>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
