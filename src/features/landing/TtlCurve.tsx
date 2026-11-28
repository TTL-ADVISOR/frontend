import { RECOMMENDED, SAMPLE } from './sample'

/**
 * 소개 페이지용 예시 차트: TTL 후보별 히트율 곡선과 추천 지점.
 * 값은 설계 문서의 추천 규칙(오래된 응답 1% 이하, 최대 히트율의 90%에 처음 닿는 가장 작은 TTL)에 맞춘 예시다.
 */
const W = 480
const H = 248
const LEFT = 40
const RIGHT = 20
const TOP = 20
const BOTTOM = 40
const plotW = W - LEFT - RIGHT
const plotH = H - TOP - BOTTOM

const x = (i: number) => LEFT + (i * plotW) / (SAMPLE.length - 1)
const y = (percent: number) => TOP + plotH * (1 - percent / 100)

export default function TtlCurve() {
  const maxHit = Math.max(...SAMPLE.map((p) => p.hit))
  const kneeLine = maxHit * 0.9
  const firstStale = SAMPLE.findIndex((p) => p.stale > 1)
  const line = SAMPLE.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(p.hit)}`).join(' ')
  const rec = SAMPLE[RECOMMENDED]
  const staleX = (x(firstStale - 1) + x(firstStale)) / 2

  return (
    <svg
      className="ttl-curve"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`TTL별 히트율 예시. 1초 ${SAMPLE[0].hit}%에서 1시간 ${SAMPLE.at(-1)!.hit}%까지 오른다. 5분부터는 오래된 응답이 1%를 넘어 제외되고, 추천 TTL은 ${rec.label}(히트율 ${rec.hit}%)이다.`}
    >
      {/* 오래된 응답 1% 초과로 제외되는 구간 */}
      <rect className="ttl-curve__excluded" x={staleX} y={TOP} width={W - RIGHT - staleX} height={plotH} />
      <text className="ttl-curve__note" x={W - RIGHT - 6} y={TOP + 14} textAnchor="end">
        오래된 응답 1% 초과
      </text>

      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line className="ttl-curve__grid" x1={LEFT} x2={W - RIGHT} y1={y(v)} y2={y(v)} />
          <text className="ttl-curve__tick" x={LEFT - 8} y={y(v) + 4} textAnchor="end">
            {v}%
          </text>
        </g>
      ))}
      {SAMPLE.map((p, i) => (
        <text key={p.label} className="ttl-curve__tick" x={x(i)} y={H - BOTTOM + 20} textAnchor="middle">
          {p.label}
        </text>
      ))}

      {/* 최대 히트율의 90% */}
      <line className="ttl-curve__knee" x1={LEFT} x2={W - RIGHT} y1={y(kneeLine)} y2={y(kneeLine)} />
      <text className="ttl-curve__note" x={LEFT + 6} y={y(kneeLine) - 6}>
        최대 히트율의 90%
      </text>

      <path className="ttl-curve__line" d={line} pathLength={1} />
      {SAMPLE.map((p, i) => (
        <circle key={p.label} className="ttl-curve__dot" cx={x(i)} cy={y(p.hit)} r={3} />
      ))}

      <line className="ttl-curve__pick-rule" x1={x(RECOMMENDED)} x2={x(RECOMMENDED)} y1={y(rec.hit)} y2={TOP + plotH} />
      <circle className="ttl-curve__pick" cx={x(RECOMMENDED)} cy={y(rec.hit)} r={6} />
      <text className="ttl-curve__pick-label" x={x(RECOMMENDED) + 10} y={y(rec.hit) + 22}>
        추천 {rec.label}
      </text>
    </svg>
  )
}
