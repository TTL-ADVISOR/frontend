import type { UploadStatus } from '../../api/uploads'
import Icon from '../../components/Icon'

const LABELS: Record<UploadStatus, string> = {
  UPLOADED: '대기 중',
  PARSING: '처리 중',
  PARSED: '완료',
  FAILED: '실패',
}

export function StatusBadge({ status }: { status: UploadStatus }) {
  // 실패는 빨강 계열이라 브랜드 빨강과 헷갈리지 않게 아이콘을 함께 붙인다
  return (
    <span className={`badge badge--${status.toLowerCase()}`}>
      {status === 'FAILED' && <Icon name="alert" />}
      {LABELS[status]}
    </span>
  )
}
