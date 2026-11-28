/** 소개 화면 예시: TTL 후보별 히트율(%)과 오래된 응답 비율(%) */
export const SAMPLE = [
  { label: '1초', hit: 4, stale: 0 },
  { label: '5초', hit: 15, stale: 0 },
  { label: '10초', hit: 27, stale: 0 },
  { label: '30초', hit: 55, stale: 0.1 },
  { label: '1분', hit: 74, stale: 0.3 },
  { label: '2분', hit: 77, stale: 0.6 },
  { label: '5분', hit: 79, stale: 1.4 },
  { label: '10분', hit: 80, stale: 2.8 },
  { label: '30분', hit: 81, stale: 5.1 },
  { label: '1시간', hit: 81, stale: 7.9 },
] as const

export const RECOMMENDED = 4
