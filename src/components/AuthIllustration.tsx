import type { CSSProperties, ReactNode } from 'react'

/** 24×24 선 아이콘. currentColor로 그린다. */
const ICONS: Record<string, ReactNode> = {
  hourglass: (
    <>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
      <path d="M9.5 18.5h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9.5 2h5M12 2v3" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  chart: <path d="M4 19h16M5 15l4-5 4 3 6-8" />,
}

type Tone = 'brand' | 'dark' | 'tint' | 'soft' | 'line'

interface Bubble {
  icon: keyof typeof ICONS
  tone: Tone
  size: number
  x: number
  y: number
  delay: number
}

// 위치는 그림 영역 기준 %. 크기가 다르게 흩어 두고, 위아래로 천천히 떠다니게 한다.
const BUBBLES: Bubble[] = [
  { icon: 'hourglass', tone: 'brand', size: 88, x: 10, y: 22, delay: 0 },
  { icon: 'clock', tone: 'dark', size: 64, x: 70, y: 8, delay: 1.2 },
  { icon: 'percent', tone: 'tint', size: 56, x: 30, y: 52, delay: 0.6 },
  { icon: 'database', tone: 'soft', size: 72, x: 78, y: 46, delay: 1.8 },
  { icon: 'stopwatch', tone: 'tint', size: 48, x: 52, y: 26, delay: 2.4 },
  { icon: 'bolt', tone: 'dark', size: 52, x: 60, y: 74, delay: 0.9 },
  { icon: 'chart', tone: 'line', size: 60, x: 12, y: 78, delay: 1.5 },
]

const DOTS = [
  { x: 42, y: 12, size: 8, tone: 'brand' },
  { x: 90, y: 30, size: 6, tone: 'dark' },
  { x: 24, y: 40, size: 10, tone: 'soft' },
  { x: 86, y: 82, size: 9, tone: 'brand' },
  { x: 44, y: 88, size: 6, tone: 'dark' },
]

/**
 * 로그인·회원가입 화면 오른쪽 그림. 시간(모래시계·시계·스톱워치), 비율(%), 캐시(DB), 속도, 곡선 아이콘과
 * 서비스가 하는 일을 보여 주는 작은 카드(추천 TTL, 히트율)로 구성한다. 꾸밈용이라 스크린리더에서는 숨긴다.
 */
export default function AuthIllustration() {
  return (
    <div className="auth-art" aria-hidden="true">
      {DOTS.map((dot, i) => (
        <span
          key={`dot-${i}`}
          className={`auth-art__dot auth-art__dot--${dot.tone}`}
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size }}
        />
      ))}
      {BUBBLES.map((b) => (
        <span
          key={b.icon}
          className={`auth-art__bubble auth-art__bubble--${b.tone}`}
          style={
            {
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              '--float-delay': `${b.delay}s`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 24 24" width={b.size * 0.42} height={b.size * 0.42}>
            {ICONS[b.icon]}
          </svg>
        </span>
      ))}

      <div className="auth-art__card auth-art__card--ttl" style={{ '--float-delay': '0.4s' } as CSSProperties}>
        <span className="auth-art__card-label">추천 TTL</span>
        <strong className="auth-art__card-value">300s</strong>
      </div>
      <div className="auth-art__card auth-art__card--hit" style={{ '--float-delay': '2s' } as CSSProperties}>
        <span className="auth-art__card-label">예상 히트율</span>
        <strong className="auth-art__card-value">91%</strong>
        <span className="auth-art__bar">
          <span style={{ width: '91%' }} />
        </span>
      </div>
    </div>
  )
}
