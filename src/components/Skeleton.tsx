/** 표를 불러오는 동안 보여 주는 빈 줄. 화면 읽기 프로그램에는 label만 읽힌다. */
export function SkeletonRows({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" className="skeleton">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__row" aria-hidden="true">
          <span className="skeleton__bar skeleton__bar--wide" />
          <span className="skeleton__bar" />
          <span className="skeleton__bar skeleton__bar--short" />
        </div>
      ))}
    </div>
  )
}
