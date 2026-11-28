import { Link, Outlet } from 'react-router'
import { HERO_RESULTS } from '../features/landing/content'
import BrandMark from './BrandMark'

// 소개 화면과 같은 예시 결과에서 숫자를 계산한다 (화면마다 숫자가 어긋나지 않게)
const cached = HERO_RESULTS.filter((row) => row.verdict === 'cache')
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const AVG_HIT = Math.round(average(cached.map((row) => parseFloat(row.hit))))
const AVG_STALE = average(cached.map((row) => parseFloat(row.stale))).toFixed(1)

/**
 * 로그인·회원가입 전용 화면: 왼쪽 로고와 폼, 오른쪽 먹색 면에 추천 기준과 예시 수치.
 * 서비스 소개 문장은 폼 위 부제목에 있으니, 오른쪽에는 부제목에 없는 내용(무엇을 기준으로 고르는지, 결과가 어느 정도인지)만 둔다.
 * 빨강은 로고에만 쓴다. 좁은 화면에서는 오른쪽 면을 숨긴다.
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
          <p className="auth-panel__text">
            TTL 후보마다 로그를 다시 흘려 보고, 두 조건을 함께 맞추는 TTL을 엔드포인트마다 골라요.
          </p>
          <dl className="auth-panel__stats">
            <div className="auth-panel__stat">
              <dt>평균 예상 히트율</dt>
              <dd>{AVG_HIT}%</dd>
            </div>
            <div className="auth-panel__stat">
              <dt>평균 오래된 응답</dt>
              <dd>{AVG_STALE}%</dd>
            </div>
            <div className="auth-panel__stat">
              <dt>캐시를 추천한 엔드포인트</dt>
              <dd>
                {cached.length}
                <span className="auth-panel__of">/{HERO_RESULTS.length}</span>
              </dd>
            </div>
          </dl>
          <p className="auth-panel__note">
            예시 로그로 돌려 본 결과예요. 평균은 캐시를 추천한 엔드포인트 {cached.length}개 기준이에요.
          </p>
        </div>
        <BrandMark className="auth-panel__mark" />
      </aside>
    </div>
  )
}
