import { Link, Outlet } from 'react-router'
import BrandMark from './BrandMark'

/**
 * 로그인·회원가입 전용 화면: 왼쪽 로고와 폼, 오른쪽 브랜드 빨강 면.
 * 오른쪽은 큰 로고만 두는 장식이라 화면 읽기 프로그램에서는 숨긴다.
 * 소개 문장은 폼 위 부제목에만 둔다 (같은 말을 두 번 하지 않는다). 좁은 화면에서는 빨강 면을 숨긴다.
 */
export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__side">
        <header className="auth-shell__header">
          <Link to="/" className="brand">
            <BrandMark className="brand__mark" />
            <span className="brand__name">TTL Advisor</span>
          </Link>
        </header>
        <main className="auth-shell__form">
          <Outlet />
        </main>
      </div>
      <div className="auth-panel" aria-hidden="true">
        <BrandMark className="auth-panel__mark" />
      </div>
    </div>
  )
}
