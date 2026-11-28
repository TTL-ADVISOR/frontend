import type { UploadStatus } from '../../api/uploads'

const LABELS: Record<UploadStatus, string> = {
  UPLOADED: '대기 중',
  PARSING: '처리 중',
  PARSED: '완료',
  FAILED: '실패',
}

export function StatusBadge({ status }: { status: UploadStatus }) {
  return <span className={`badge badge--${status.toLowerCase()}`}>{LABELS[status]}</span>
}
