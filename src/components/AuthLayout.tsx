import { Link, Outlet } from 'react-router'
import { HERO_RESULTS } from '../features/landing/content'
import BrandMark from './BrandMark'

// 오른쪽 면에 보여 줄 예시: 짧은 TTL, 긴 TTL, 캐시 비추천을 하나씩
const PANEL_ENDPOINTS = ['GET /products/:id', 'GET /categories', 'GET /users/:id/cart']
const PANEL_ROWS = HERO_RESULTS.filter((row) => PANEL_ENDPOINTS.includes(row.endpoint))

/**
 * 로그인·회원가입 전용 화면: 왼쪽 로고와 폼, 오른쪽 먹색 면에 추천 기준과 결과 예시.
 * 서비스 소개 문장은 폼 위 부제목에 있으니, 오른쪽에는 부제목에 없는 내용(무엇을 기준으로 고르는지, 결과가 어떻게 나오는지)만 둔다.
 * 빨강은 로고와 추천 TTL에만 쓴다. 좁은 화면에서는 오른쪽 면을 숨긴다.
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
      <aside className="auth-panel" aria-labelledby="auth-panel-title">
        <div>
          <h2 id="auth-panel-title" className="auth-panel__title">
            히트율은 높게,
            <br />
            오래된 응답은 1% 이하로
          </h2>
          <table className="auth-panel__table">
            <caption className="auth-panel__caption">예시 데이터</caption>
            <thead>
              <tr>
                <th scope="col">엔드포인트</th>
                <th scope="col">추천 TTL</th>
                <th scope="col">히트율</th>
                <th scope="col">오래된 응답</th>
              </tr>
            </thead>
            <tbody>
              {PANEL_ROWS.map((row) => (
                <tr key={row.endpoint}>
                  <th scope="row">
                    <code>{row.endpoint}</code>
                  </th>
                  <td>
                    {row.ttl ? (
                      <strong className="auth-panel__ttl">{row.ttl}</strong>
                    ) : (
                      <span className="auth-panel__verdict">캐시 비추천</span>
                    )}
                  </td>
                  <td>{row.hit}</td>
                  <td>{row.stale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <BrandMark className="auth-panel__mark" />
      </aside>
    </div>
  )
}
