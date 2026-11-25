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
  size: number
  /** 그림 영역 기준 왼쪽 위 위치(%) */
  x: number
  y: number
  /** 떠다니는 요소는 2~3개만. 값은 애니메이션 지연(초) */
  float?: number
}

// 가볍고 띄엄띄엄: 원 7개(큰 2 · 가운데 72 하나 · 중간 2 · 작은 2), 점 3개.
// 색: 빨강·검정·흰색이 기본이고, 빨강과 같은 따뜻한 계열인 앰버(골드)와 피치를 곁들여 다채롭게 한다.
// 진한 빨강은 큰 모래시계와 점 하나뿐, 연빨강 원은 하나만.
// 위치는 1440px(그림 영역 약 690×560)과 1024px(약 470×540) 모두에서 요소 사이가 40px 이상,
// 가장자리에서 8% 이상 떨어지도록 맞췄다. 무리의 세로 중심이 영역(=폼)의 세로 중심과 맞는다.
const BUBBLES: Bubble[] = [
  { icon: 'hourglass', tone: 'brand', size: 96, x: 12, y: 20, float: 0 },
  { icon: 'clock', tone: 'dark', size: 88, x: 70, y: 12 },
  { icon: 'database', tone: 'gold', size: 64, x: 74, y: 52, float: 2.2 },
  { icon: 'chart', tone: 'line', size: 64, x: 14, y: 73 },
  { icon: 'bolt', tone: 'peach', size: 48, x: 50, y: 14 },
  { icon: 'percent', tone: 'tint', size: 48, x: 56, y: 76 },
  // 가운데: 만료·갱신(TTL)을 뜻하는 아이콘. 다른 원과 크기가 겹치지 않게 72px, 차분한 연회색
  { icon: 'history', tone: 'soft', size: 72, x: 38, y: 47 },
]

const DOTS: { x: number; y: number; size: number; tone: Tone }[] = [
  { x: 42, y: 30, size: 8, tone: 'dark' },
  { x: 86, y: 38, size: 8, tone: 'gold' },
  { x: 88, y: 80, size: 9, tone: 'brand' },
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
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size }}
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
              width: b.size,
              height: b.size,
              '--float-delay': `${b.float ?? 0}s`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 24 24" width={b.size * 0.42} height={b.size * 0.42}>
            {ICONS[b.icon]}
          </svg>
        </span>
      ))}
    </div>
  )
}
