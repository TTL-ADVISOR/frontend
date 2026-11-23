import { Link, Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/projects" className="layout__brand">
          TTL Advisor
        </Link>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
