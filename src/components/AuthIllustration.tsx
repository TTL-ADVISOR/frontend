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
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  chart: <path d="M4 19h16M5 15l4-5 4 3 6-8" />,
}

type Tone = 'brand' | 'dark' | 'tint' | 'soft' | 'line' | 'gold' | 'peach'

interface Bubble {
  icon: keyof typeof ICONS
  tone: Tone
  /** 그림 영역 기준 왼쪽 위 위치와 지름. 모두 영역 너비·높이에 대한 %라 화면 폭이 달라도 비율이 같다 */
  x: number
  y: number
  w: number
  /** 떠다니는 요소는 2~3개만. 값은 애니메이션 지연(초) */
  float?: number
}

// 배치는 레퍼런스(Frame 로그인 화면)의 원 7개·점 4개 위치와 지름을 그대로 옮겼다.
// 레퍼런스의 무리 영역(840×580)을 기준으로 % 환산했고, 원 크기 순서대로 우리 아이콘을 배정했다.
const BUBBLES: Bubble[] = [
  { icon: 'hourglass', tone: 'brand', x: 81.5, y: 42.9, w: 12.1, float: 0 },
  { icon: 'clock', tone: 'dark', x: 6.5, y: 20.2, w: 10 },
  { icon: 'database', tone: 'gold', x: 63.3, y: 6.4, w: 8.1, float: 2.2 },
  { icon: 'history', tone: 'soft', x: 58.1, y: 68.6, w: 8.1 },
  { icon: 'chart', tone: 'line', x: 25.8, y: 81.2, w: 8.1 },
  { icon: 'percent', tone: 'tint', x: 26.1, y: 46, w: 7.4, float: 1.1 },
  { icon: 'bolt', tone: 'peach', x: 41.1, y: 19.5, w: 5.95 },
]

const DOTS: { x: number; y: number; w: number; tone: Tone }[] = [
  { x: 33.6, y: 9.5, w: 1.2, tone: 'dark' },
  { x: 57.5, y: 40.2, w: 1.2, tone: 'dark' },
  { x: 19.2, y: 42.8, w: 2.1, tone: 'gold' },
  { x: 87.4, y: 79.3, w: 1.9, tone: 'brand' },
]

/**
 * 로그인·회원가입 화면 오른쪽 그림. 시간(모래시계·시계), 만료·갱신, 비율(%), 캐시(DB), 속도, 곡선 아이콘으로 구성한다. 꾸밈용이라 스크린리더에서는 숨긴다.
 */
export default function AuthIllustration() {
  return (
    <div className="auth-art" aria-hidden="true">
      {DOTS.map((dot, i) => (
        <span
          key={`dot-${i}`}
          className={`auth-art__dot auth-art__dot--${dot.tone}`}
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: `${dot.w}cqw`, height: `${dot.w}cqw` }}
        />
      ))}
      {BUBBLES.map((b) => (
        <span
          key={b.icon}
          className={`auth-art__bubble auth-art__bubble--${b.tone}${b.float !== undefined ? ' auth-art__float' : ''}`}
          style={
            {
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.w}cqw`,
              height: `${b.w}cqw`,
              '--float-delay': `${b.float ?? 0}s`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 24 24">
            {ICONS[b.icon]}
          </svg>
        </span>
      ))}
    </div>
  )
}
