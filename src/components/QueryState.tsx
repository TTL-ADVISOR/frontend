import { ApiError } from '../api/client'

export function Loading({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <p role="status" className="muted">
      {label}
    </p>
  )
}

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError ? error.message : '알 수 없는 오류가 발생했습니다.'
  return (
    <div role="alert" className="notice notice--error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  )
}
