import type { UploadDetail } from '../../api/uploads'
import { ErrorMessage, Loading } from '../../components/QueryState'
import { formatDateTime } from '../../lib/format'
import { useUpload } from './queries'
import { StatusBadge } from './StatusBadge'

const numberFormat = new Intl.NumberFormat('ko-KR')
const n = (value: number) => numberFormat.format(value)

/** 업로드 한 건의 처리 상태. 처리 중이면 1초마다 다시 불러온다. */
export default function UploadDetailCard({ uploadId }: { uploadId: number }) {
  const upload = useUpload(uploadId)

  if (upload.isPending) return <Loading label="업로드 상태를 불러오는 중…" />
  if (upload.isError) return <ErrorMessage error={upload.error} onRetry={() => upload.refetch()} />

  return (
    <article className="card upload-detail" aria-label={`${upload.data.filename} 처리 상태`}>
      <header className="upload-detail__header">
        <h3 className="upload-detail__name">{upload.data.filename}</h3>
        <StatusBadge status={upload.data.status} />
      </header>
      <Body upload={upload.data} />
    </article>
  )
}

function Body({ upload }: { upload: UploadDetail }) {
  switch (upload.status) {
    case 'UPLOADED':
    case 'PARSING':
      return (
        <div role="status" className="stack upload-detail__progress">
          <p>
            {upload.status === 'UPLOADED' ? '처리를 기다리는 중…' : `${n(upload.processedLines)}줄 처리함`}
          </p>
          {/* 전체 줄 수는 끝나야 알 수 있어서 진행 막대는 정해진 끝이 없다 */}
          <div className="progress-indeterminate" role="progressbar" aria-label="로그 처리 중">
            <span />
          </div>
        </div>
      )
    case 'PARSED':
      return (
        <div className="stack">
          <dl className="upload-detail__facts">
            <div>
              <dt>전체</dt>
              <dd>{n(upload.totalLines ?? upload.processedLines)}줄</dd>
            </div>
            <div>
              <dt>실패</dt>
              <dd>{n(upload.errorLines)}줄</dd>
            </div>
            {upload.rangeStart && upload.rangeEnd && (
              <div>
                <dt>로그 기간</dt>
                <dd>
                  <time dateTime={upload.rangeStart}>{formatDateTime(upload.rangeStart)}</time> ~{' '}
                  <time dateTime={upload.rangeEnd}>{formatDateTime(upload.rangeEnd)}</time>
                </dd>
              </div>
            )}
          </dl>
          <ErrorSamples upload={upload} />
        </div>
      )
    case 'FAILED':
      return (
        <div className="stack">
          <p className="upload-detail__failure" role="alert">
            {upload.failureReason ?? '처리하지 못했습니다.'}
          </p>
          <p className="muted">
            한 줄에 JSON 객체 하나씩, <code>ts</code>·<code>method</code>·<code>path</code>·<code>status</code>{' '}
            필드가 있어야 해요.
          </p>
          <pre className="upload-detail__example">
            {'{"ts":"2026-11-22T10:00:00.123Z","method":"GET","path":"/products/42","status":200}'}
          </pre>
          <ErrorSamples upload={upload} />
        </div>
      )
  }
}

function ErrorSamples({ upload }: { upload: UploadDetail }) {
  if (upload.errorSamples.length === 0) return null
  return (
    <details className="upload-detail__samples">
      <summary>
        실패한 줄 보기 ({n(upload.errorSamples.length)}개
        {upload.errorLines > upload.errorSamples.length ? ` / 전체 ${n(upload.errorLines)}줄` : ''})
      </summary>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">줄</th>
            <th scope="col">사유</th>
          </tr>
        </thead>
        <tbody>
          {upload.errorSamples.map((sample) => (
            <tr key={sample.line}>
              <td>{n(sample.line)}</td>
              <td>{sample.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
