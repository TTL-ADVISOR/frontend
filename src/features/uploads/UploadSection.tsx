import { useState } from 'react'
import { ErrorMessage, Loading } from '../../components/QueryState'
import UploadDetailCard from './UploadDetailCard'
import UploadDropzone from './UploadDropzone'
import UploadHistory from './UploadHistory'
import { useUploads } from './queries'

/** 프로젝트 화면의 로그 업로드 영역: 올리기 → 처리 상태 → 이력 */
export default function UploadSection({ projectId }: { projectId: number }) {
  const uploads = useUploads(projectId)
  // 고르지 않았으면 가장 최근 업로드를 보여 준다
  const [selectedId, setSelectedId] = useState<number>()
  const shownId = selectedId ?? uploads.data?.[0]?.id

  return (
    <section className="stack" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="section-title">
        로그 업로드
      </h2>
      <UploadDropzone projectId={projectId} onAccepted={(accepted) => setSelectedId(accepted.id)} />

      {shownId !== undefined && <UploadDetailCard key={shownId} uploadId={shownId} />}

      {uploads.isPending ? (
        <Loading label="업로드 이력을 불러오는 중…" />
      ) : uploads.isError ? (
        <ErrorMessage error={uploads.error} onRetry={() => uploads.refetch()} />
      ) : uploads.data.length === 0 ? (
        <div className="card empty">
          <p className="empty__title">아직 올린 로그가 없습니다</p>
          <p className="muted">API 액세스 로그를 올리면 엔드포인트별로 분석할 수 있어요.</p>
        </div>
      ) : (
        <div className="stack upload-history-wrap">
          <h3 className="section-subtitle">업로드 이력</h3>
          <UploadHistory uploads={uploads.data} selectedId={shownId} onSelect={setSelectedId} />
        </div>
      )}
    </section>
  )
}
