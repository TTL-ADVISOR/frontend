import { Fragment } from 'react'
import { Link } from 'react-router'
import BrandMark from '../components/BrandMark'
import CodeBlock from '../components/CodeBlock'
import Tabs from '../components/Tabs'
import { useMe } from '../features/auth/queries'
import TtlCurve from '../features/landing/TtlCurve'
import { configSnippets, FAQ, GITHUB_ORG, LOG_FIELDS, NGINX_LOG, SPRING_LOG } from '../features/landing/content'
import { RECOMMENDED, RECOMMENDED_SECONDS, SAMPLE } from '../features/landing/sample'

/**
 * 로그인 전에 보는 서비스 소개 화면.
 * 빨강은 로고와 추천 결과(추천 TTL, 추천 점)에만 쓴다. 경고는 앰버. docs/DESIGN.md 참고.
 */
const SAMPLE_LINE =
  '{"ts":"2026-11-23T10:00:00.123Z","method":"GET","path":"/products/123?lang=ko","status":200,"latencyMs":42}'

export default function LandingPage() {
  const me = useMe()
  const rec = SAMPLE[RECOMMENDED]
  const snippets = configSnippets(RECOMMENDED_SECONDS)

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
                요청 한 줄에 JSON 하나씩 담은 파일을 올려요. 필요한 필드는 <a href="#format-title">로그 형식</a>에
                있어요.
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

        <section className="doc doc--tint" aria-labelledby="format-title">
          <div className="doc__head">
            <h2 id="format-title" className="doc__title">
              로그 형식
            </h2>
            <p className="doc__lead">필수 필드 네 개만 있으면 돼요. 알 수 없는 필드는 무시해요.</p>
          </div>
          <div className="doc__body">
            <table className="fields">
              <caption className="sr-only">로그 필드</caption>
              <thead>
                <tr>
                  <th scope="col">필드</th>
                  <th scope="col">필수</th>
                  <th scope="col">쓰임</th>
                </tr>
              </thead>
              <tbody>
                {LOG_FIELDS.map((field) => (
                  <tr key={field.name}>
                    <th scope="row">
                      <code>{field.name}</code>
                    </th>
                    <td className={field.required ? 'fields__required' : undefined}>
                      {field.required ? '필수' : '선택'}
                    </td>
                    <td>{field.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Tabs
              label="로그를 이 형식으로 남기는 방법"
              items={[
                {
                  id: 'nginx',
                  label: 'Nginx',
                  content: (
                    <>
                      <CodeBlock label="Nginx 로그 설정" code={NGINX_LOG} />
                      <p className="doc__note">
                        <code>$request_time</code>은 초 단위 소수라 정수인 <code>latencyMs</code>로 쓸 수 없어 뺐어요.
                      </p>
                    </>
                  ),
                },
                {
                  id: 'spring',
                  label: 'Spring Boot',
                  content: (
                    <>
                      <CodeBlock label="Spring 로그 필터" code={SPRING_LOG} />
                      <p className="doc__note">
                        Logback에서 <code>ttl.access</code> 로거를 <code>%msg%n</code> 패턴으로 따로 파일에 남기세요.
                      </p>
                    </>
                  ),
                },
              ]}
            />
          </div>
        </section>

        <section className="doc" aria-labelledby="config-title">
          <div className="doc__head">
            <h2 id="config-title" className="doc__title">
              추천을 설정으로
            </h2>
            <p className="doc__lead">위 예시의 추천 TTL {rec.label}을 쓰는 곳에 맞춰 옮기면 이렇게 돼요.</p>
          </div>
          <div className="doc__body">
            <Tabs
              label="추천 TTL을 옮길 곳"
              items={[
                { id: 'redis', label: 'Redis', content: <CodeBlock label="Redis 명령" code={snippets.redis} /> },
                {
                  id: 'spring',
                  label: 'Spring Cache',
                  content: <CodeBlock label="Spring 캐시 설정" code={snippets.spring} />,
                },
                { id: 'http', label: 'HTTP 헤더', content: <CodeBlock label="HTTP 응답 헤더" code={snippets.http} /> },
              ]}
            />
          </div>
        </section>

        <section className="doc doc--tint" aria-labelledby="faq-title">
          <div className="doc__head">
            <h2 id="faq-title" className="doc__title">
              자주 묻는 질문
            </h2>
          </div>
          <div className="doc__body faq">
            {FAQ.map((item) => (
              <details key={item.q} className="faq__item">
                <summary className="faq__q">{item.q}</summary>
                <p className="faq__a">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <span className="landing__footer-brand">
          <BrandMark className="landing__footer-mark" />
          TTL Advisor
        </span>
        <nav aria-label="바닥글" className="landing__footer-links">
          <a href={GITHUB_ORG}>GitHub</a>
          <a href={`${GITHUB_ORG}/backend/blob/main/docs/DESIGN.md`}>설계 문서</a>
          <a href="#format-title">로그 형식</a>
        </nav>
      </footer>
    </div>
  )
}
