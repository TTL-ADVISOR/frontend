import { Link } from 'react-router'
import BrandMark from '../components/BrandMark'
import { useMe } from '../features/auth/queries'
import TtlCurve from '../features/landing/TtlCurve'
import { RECOMMENDED, SAMPLE } from '../features/landing/sample'

/** 로그인 전에 보는 서비스 소개 화면. 로그인한 사용자에게는 바로 프로젝트로 가는 버튼을 보여 준다. */
export default function LandingPage() {
  const me = useMe()
  const signedIn = Boolean(me.data)
  const rec = SAMPLE[RECOMMENDED]

  return (
    <div className="landing">
      <header className="landing__header">
        <Link to="/" className="brand">
          <BrandMark className="brand__mark" />
          <span className="brand__name">TTL Advisor</span>
        </Link>
        {/* 로그인 상태를 확인하는 동안은 버튼을 비워 둔다 (잘못된 버튼이 잠깐 보이지 않게) */}
        <nav className="landing__actions" aria-label="계정">
          {me.isPending ? null : signedIn ? (
            <Link to="/projects" className="button button--primary">
              내 프로젝트로
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing__login">
                로그인
              </Link>
              <Link to="/signup" className="button button--primary">
                시작하기
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="landing__hero" aria-labelledby="landing-title">
          <div className="landing__intro">
            <h1 id="landing-title" className="landing__title">
              엔드포인트별 캐시 TTL,
              <br />
              로그로 정하세요
            </h1>
            <p className="landing__lead">
              API 액세스 로그를 올리면 TTL 후보마다 히트율과 오래된 응답 비율을 재생해 보고, 엔드포인트마다 알맞은
              Redis TTL과 그 근거를 알려 드려요.
            </p>
            <div className="landing__cta">
              {signedIn ? (
                <Link to="/projects" className="button button--primary button--large">
                  내 프로젝트로 가기
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="button button--primary button--large">
                    무료로 시작하기
                  </Link>
                  <Link to="/login" className="button button--large">
                    로그인
                  </Link>
                </>
              )}
            </div>
            <p className="landing__fineprint">JSON Lines 로그 · 파일 하나에 100MB까지</p>
          </div>

          <figure className="result-preview">
            <div className="result-preview__head">
              <code className="result-preview__endpoint">GET /products/:id</code>
              <span className="badge badge--parsed">캐시 추천</span>
            </div>
            <dl className="result-preview__facts">
              <div>
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
            <figcaption className="result-preview__caption">
              예시 데이터입니다. 5분부터는 히트율이 조금 더 오르지만 오래된 응답이 1%를 넘어 후보에서 빠집니다.
            </figcaption>
          </figure>
        </section>

        <section className="landing__how" aria-labelledby="how-title">
          <h2 id="how-title" className="landing__h2">
            이렇게 동작해요
          </h2>
          <ol className="steps">
            <li className="step">
              <div className="step__text">
                <h3 className="step__title">로그 올리기</h3>
                <p>
                  한 줄에 요청 하나씩 JSON Lines로 올려요. ts·method·path·status만 있으면 되고, latencyMs·size·respHash가
                  있으면 절감 시간과 오래된 응답을 더 정확히 계산해요.
                </p>
              </div>
              <pre className="step__art">
                <code>{`{"ts":"2026-11-23T10:00:00.123Z",
 "method":"GET",
 "path":"/products/123?lang=ko",
 "status":200,"latencyMs":42,
 "respHash":"a1b2c3"}`}</code>
              </pre>
            </li>
            <li className="step">
              <div className="step__text">
                <h3 className="step__title">엔드포인트로 묶기</h3>
                <p>숫자·UUID·긴 해시는 자리표시자로 바꿔 같은 엔드포인트끼리 묶어요. 필요하면 패턴을 직접 정할 수도 있어요.</p>
              </div>
              <div className="step__art step__art--map" aria-label="경로를 엔드포인트 패턴으로 묶는 예">
                <code>/products/123?lang=ko</code>
                <code>/products/98</code>
                <code>/products/4417</code>
                <span className="step__arrow" aria-hidden="true">
                  ↓
                </span>
                <code className="step__pattern">GET /products/:id</code>
              </div>
            </li>
            <li className="step">
              <div className="step__text">
                <h3 className="step__title">TTL마다 재생하기</h3>
                <p>
                  1초부터 24시간까지 TTL 후보마다 로그를 시간 순서대로 다시 흘려 봐요. 같은 리소스에 쓰기 요청이 있으면
                  캐시를 비우고, 캐시에서 꺼낸 응답이 실제 응답과 다르면 오래된 응답으로 세요.
                </p>
              </div>
              <ul className="step__art step__art--replay" aria-label="재생 예">
                <li>
                  <span>10:00:00</span> GET /products/123 <b className="replay replay--miss">miss</b>
                </li>
                <li>
                  <span>10:00:20</span> GET /products/123 <b className="replay replay--hit">hit</b>
                </li>
                <li>
                  <span>10:00:31</span> PUT /products/123 <b className="replay">캐시 비움</b>
                </li>
                <li>
                  <span>10:00:45</span> GET /products/123 <b className="replay replay--miss">miss</b>
                </li>
              </ul>
            </li>
            <li className="step">
              <div className="step__text">
                <h3 className="step__title">추천과 근거 받기</h3>
                <p>
                  데이터가 늦게 반영돼도 괜찮은 시간 안에서, 오래된 응답이 1% 이하인 후보 중 최대 히트율의 90%에 처음 닿는 가장 짧은 TTL을
                  추천해요. 캐시가 어울리지 않는 엔드포인트는 그렇다고 알려 드려요.
                </p>
              </div>
              <dl className="step__art step__art--verdicts">
                <div>
                  <dt>
                    <span className="badge badge--parsed">캐시 추천</span>
                  </dt>
                  <dd>추천 TTL과 TTL별 히트율·메모리 추정</dd>
                </div>
                <div>
                  <dt>
                    <span className="badge badge--failed">캐시 비추천</span>
                  </dt>
                  <dd>히트율이 10% 미만이거나 쓰기가 많을 때</dd>
                </div>
                <div>
                  <dt>
                    <span className="badge badge--parsing">데이터 부족</span>
                  </dt>
                  <dd>판단하기엔 요청 수가 적을 때</dd>
                </div>
              </dl>
            </li>
          </ol>
        </section>

        <section className="landing__closing" aria-labelledby="closing-title">
          <h2 id="closing-title" className="landing__h2">
            가지고 있는 로그로 바로 확인해 보세요
          </h2>
          <Link to={signedIn ? '/projects' : '/signup'} className="button button--primary button--large">
            {signedIn ? '내 프로젝트로 가기' : '무료로 시작하기'}
          </Link>
        </section>
      </main>

      <footer className="landing__footer">
        <span>TTL Advisor</span>
        <span className="muted">API 액세스 로그로 Redis TTL을 추천합니다</span>
      </footer>
    </div>
  )
}
