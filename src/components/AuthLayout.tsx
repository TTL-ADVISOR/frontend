import { Link, Outlet } from 'react-router'
import TtlCurve from '../features/landing/TtlCurve'
import { RECOMMENDED, SAMPLE } from '../features/landing/sample'
import BrandMark from './BrandMark'

/**
 * 로그인·회원가입 전용 화면: 왼쪽 로고와 폼, 오른쪽 어두운 패널에 결과 예시.
 * 장식 그림 대신 서비스가 실제로 주는 결과를 보여 준다. 좁은 화면에서는 패널을 숨긴다.
 */
export default function AuthLayout() {
  const rec = SAMPLE[RECOMMENDED]
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
      <aside className="auth-panel" aria-label="분석 결과 예시">
        <p className="auth-panel__label">
          예시 데이터 · <code>GET /products/:id</code>
        </p>
        <dl className="auth-panel__facts">
          <div className="auth-panel__pick">
            <dt>추천 TTL</dt>
            <dd>{rec.label}</dd>
          </div>
          <div>
            <dt>히트율</dt>
            <dd>{rec.hit}%</dd>
          </div>
          <div>
            <dt>오래된 응답</dt>
            <dd>{rec.stale}%</dd>
          </div>
        </dl>
        <TtlCurve />
        <p className="auth-panel__note">오래된 응답이 1% 이하인 TTL 중 히트율이 충분히 오른 가장 짧은 값을 골라요.</p>
      </aside>
    </div>
  )
}
