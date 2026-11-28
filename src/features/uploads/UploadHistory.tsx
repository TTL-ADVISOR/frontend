import type { UploadSummary } from '../../api/uploads'
import { formatDateTime } from '../../lib/format'
import { StatusBadge } from './StatusBadge'

interface Props {
  uploads: UploadSummary[]
  selectedId: number | undefined
  onSelect: (uploadId: number) => void
}

const numberFormat = new Intl.NumberFormat('ko-KR')

/** 이 프로젝트에 올린 로그 목록 (최근 순). 항목을 누르면 위에 처리 상태를 보여 준다. */
export default function UploadHistory({ uploads, selectedId, onSelect }: Props) {
  return (
    <ul className="upload-history" aria-label="업로드 이력">
      {uploads.map((upload) => (
        <li key={upload.id}>
          <button
            type="button"
            className="upload-history__item"
            aria-current={upload.id === selectedId ? 'true' : undefined}
            onClick={() => onSelect(upload.id)}
          >
            <span className="upload-history__name">{upload.filename}</span>
            <span className="upload-history__meta muted">
              <time dateTime={upload.createdAt}>{formatDateTime(upload.createdAt)}</time>
              {upload.status === 'PARSED' && upload.totalLines !== null && (
                <> · {numberFormat.format(upload.totalLines)}줄</>
              )}
            </span>
            <StatusBadge status={upload.status} />
          </button>
        </li>
      ))}
    </ul>
  )
}
