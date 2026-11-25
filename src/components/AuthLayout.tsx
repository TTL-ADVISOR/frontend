import { Link, Outlet } from 'react-router'
import AuthIllustration from './AuthIllustration'
import BrandMark from './BrandMark'

/** 로그인·회원가입 전용 화면: 왼쪽 위 로고, 왼쪽 폼, 오른쪽 그림. 좁은 화면에서는 그림을 숨긴다. */
export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <header className="auth-shell__header">
        <Link to="/projects" className="layout__brand">
          <BrandMark className="layout__brand-mark" />
          <span className="layout__brand-name">TTL Advisor</span>
        </Link>
      </header>
      <main className="auth-shell__main">
        <div className="auth-shell__form">
          <Outlet />
        </div>
        <div className="auth-shell__art">
          <AuthIllustration />
        </div>
      </main>
    </div>
  )
}
