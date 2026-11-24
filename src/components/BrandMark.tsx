import { useId } from 'react'

// TA 마크: T 가로획과 A 꼭대기를 합친 형태 + 가로 슬릿. 원본은 /logo/ta-mark.svg
const MARK_PATH =
  'M15 0H335L377 255H310L303 208H203L172 255H108L232 60H145L97 255H33L80 60H0Z M283 72L300 164H225Z'

export default function BrandMark({ className }: { className?: string }) {
  const maskId = useId()
  return (
    <svg className={className} viewBox="0 0 377 255" aria-hidden="true" focusable="false">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="-10" width="400" height="280">
        <rect x="-10" y="-10" width="400" height="280" fill="#fff" />
        <rect x="-10" y="116" width="400" height="11" fill="#000" />
      </mask>
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" mask={`url(#${maskId})`} />
    </svg>
  )
}
