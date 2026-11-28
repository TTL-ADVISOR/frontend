import { Fragment } from 'react'
import { Link } from 'react-router'
import BrandMark from '../components/BrandMark'
import { useMe } from '../features/auth/queries'
import TtlCurve from '../features/landing/TtlCurve'
import { RECOMMENDED, SAMPLE } from '../features/landing/sample'

/**
 * 로그인 전에 보는 서비스 소개 화면.
 * 빨강은 로고와 추천 결과(추천 TTL, 추천 점)에만 쓴다. 경고는 앰버. docs/DESIGN.md 참고.
 */
const SAMPLE_LINE =
  '{"ts":"2026-11-23T10:00:00.123Z","method":"GET","path":"/products/123?lang=ko","status":200,"latencyMs":42}'

export default function LandingPage() {
  const me = useMe()
  const rec = SAMPLE[RECOMMENDED]

  return (
    <div className="landing">
      <header className="landing__header">
        <Link to="/" className="brand">
          <BrandMark className="brand__mark" />
          <span className="brand__name">TTL Advisor</span>
        </Link>
        {/* 로그인 상태를 확인하는 동안은 비워 둔다. 시작하기는 첫 화면에만 둔다 (같은 버튼을 반복하지 않는다) */}
        <nav className="landing__actions" aria-label="계정">
          {me.isPending ? null : me.data ? (
            <Link to="/projects" className="button button--primary">
              내 프로젝트로
            </Link>
          ) : (
            <Link to="/login" className="landing__login">
              로그인
            </Link>
          )}
        </nav>
      </header>

      <main>
        <section className="landing__hero" aria-labelledby="landing-title">
          <h1 id="landing-title" className="landing__title">
            캐시 TTL은
            <br />
            로그가 정합니다
          </h1>
          <p className="landing__lead">
            API 액세스 로그를 올리면 엔드포인트마다 알맞은 Redis TTL과 그 근거를 알려 드려요.
          </p>
          <div className="landing__cta">
            {!me.isPending && !me.data && (
              <Link to="/signup" className="button button--primary landing__button">
                시작하기
              </Link>
            )}
            <a href="#how-title" className="button landing__button">
              추천 방식 보기
            </a>
          </div>
          <p className="landing__note">JSON Lines 로그 · 파일 하나에 100MB까지</p>
        </section>

        <section className="proof" aria-label="분석 결과 예시">
          <div className="proof__inner">
            <p className="proof__label">
              예시 데이터 · <code>GET /products/:id</code>
            </p>
            <dl className="proof__facts">
              <div className="proof__fact proof__fact--pick">
                <dt>추천 TTL</dt>
                <dd>{rec.label}</dd>
              </div>
              <div className="proof__fact">
                <dt>히트율</dt>
                <dd>{rec.hit}%</dd>
              </div>
              <div className="proof__fact">
                <dt>오래된 응답</dt>
                <dd>{rec.stale}%</dd>
              </div>
            </dl>
            <div className="proof__chart">
              <TtlCurve />
            </div>
          </div>
        </section>

        <section className="how" aria-labelledby="how-title">
          <h2 id="how-title" className="how__title">
            이렇게 동작해요
          </h2>
          <ol className="how__steps">
            <li className="how__step">
              <h3 className="how__name">로그 올리기</h3>
              <p className="how__text">
                요청 한 줄에 JSON 하나씩 담아요. ts·method·path·status만 있으면 되고, latencyMs·size·respHash를 넣으면
                계산이 더 정확해져요.
              </p>
              <code className="how__sample">
                {/* 쉼표 뒤에서만 줄을 바꾼다 */}
                {SAMPLE_LINE.split(',').map((part, i) => (
                  <Fragment key={part}>
                    {i > 0 && (
                      <>
                        ,<wbr />
                      </>
                    )}
                    <span className="how__part">{part}</span>
                  </Fragment>
                ))}
              </code>
            </li>
            <li className="how__step">
              <h3 className="how__name">엔드포인트로 묶기</h3>
              <p className="how__text">숫자·UUID·긴 해시를 자리표시자로 바꿔 묶어요. 패턴을 직접 정할 수도 있어요.</p>
              <div className="how__sample how__sample--map">
                <span>/products/123?lang=ko</span>
                <span>/products/98</span>
                <span>/products/4417</span>
                <strong>GET /products/:id</strong>
              </div>
            </li>
            <li className="how__step">
              <h3 className="how__name">TTL마다 재생하기</h3>
              <p className="how__text">
                TTL 후보마다 로그를 시간 순서대로 다시 흘려요. 같은 리소스에 쓰기가 오면 캐시를 비우고, 바뀐 데이터를
                캐시에서 내준 경우는 오래된 응답으로 셉니다.
              </p>
              <table className="how__sample how__replay">
                <caption className="sr-only">TTL 30초로 재생한 예</caption>
                <tbody>
                  <tr>
                    <td>10:00:00</td>
                    <td>GET /products/123</td>
                    <td>miss</td>
                  </tr>
                  <tr>
                    <td>10:00:20</td>
                    <td>GET /products/123</td>
                    <td className="how__hit">hit</td>
                  </tr>
                  <tr>
                    <td>10:00:31</td>
                    <td>PUT /products/123</td>
                    <td className="how__event">비움</td>
                  </tr>
                  <tr>
                    <td>10:00:45</td>
                    <td>GET /products/123</td>
                    <td>miss</td>
                  </tr>
                </tbody>
              </table>
            </li>
            <li className="how__step">
              <h3 className="how__name">추천 받기</h3>
              <p className="how__text">
                오래된 응답이 1% 이하인 후보 중, 최대 히트율의 90%에 처음 닿는 가장 짧은 TTL을 고릅니다.
              </p>
              <dl className="how__sample how__verdicts">
                <dt>캐시 추천</dt>
                <dd>추천 TTL과 TTL별 히트율·메모리 추정</dd>
                <dt>캐시 비추천</dt>
                <dd>히트율 10% 미만이거나 쓰기가 많을 때</dd>
                <dt>데이터 부족</dt>
                <dd>판단하기엔 요청이 적을 때</dd>
              </dl>
            </li>
          </ol>
        </section>
      </main>

      <footer className="landing__footer">
        <BrandMark className="landing__footer-mark" />
        <span>TTL Advisor</span>
      </footer>
    </div>
  )
}
