import { OPTIONAL_FIELDS, PREVIEW_LINES, REQUIRED_FIELDS, type LogPreview } from './preview'

const MISSING_OPTIONAL: Record<(typeof OPTIONAL_FIELDS)[number], string> = {
  respHash: '쓰기 요청이 온 때를 데이터가 바뀐 때로 봐요. 오래된 응답 비율이 덜 정확할 수 있어요.',
  latencyMs: '아낄 수 있는 백엔드 시간은 계산하지 않아요.',
  size: '캐시 메모리는 추정하지 않아요.',
}

const sizeFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 })
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)}KB`
  return `${sizeFormat.format(bytes / 1024 / 1024)}MB`
}

interface Props {
  file: File
  preview: LogPreview | null
  onUpload: () => void
  onCancel: () => void
}

/** 올리기 전 확인: 처음 몇 줄과 필드 검사 결과. 올릴지는 사용자가 정한다. */
export default function UploadPreview({ file, preview, onUpload, onCancel }: Props) {
  const allFailed = preview !== null && preview.lines.length > 0 && preview.lines.every((line) => line.error)
  const missingOptional = preview ? OPTIONAL_FIELDS.filter((field) => !preview.optional[field]) : []

  return (
    <section className="upload-preview" aria-labelledby="upload-preview-title">
      <header className="upload-preview__header">
        <h3 id="upload-preview-title" className="upload-preview__name">
          {file.name}
        </h3>
        <span className="muted">{formatSize(file.size)}</span>
      </header>

      {preview === null ? (
        <p role="status" className="muted">
          파일 앞부분을 읽는 중…
        </p>
      ) : (
        <>
          <p className="upload-preview__basis muted">
            처음 {Math.min(PREVIEW_LINES, preview.lines.length)}줄로 확인했어요.
          </p>
          <ul className="field-checks" aria-label="필드 확인">
            {REQUIRED_FIELDS.map((field) => {
              const problem = preview.required[field]
              return (
                <li key={field} className={problem ? 'field-check field-check--bad' : 'field-check field-check--ok'}>
                  <code>{field}</code>
                  <span>{problem ? `${problem.line}번째 줄: ${problem.reason}` : '있음'}</span>
                </li>
              )
            })}
            {OPTIONAL_FIELDS.map((field) => (
              <li
                key={field}
                className={preview.optional[field] ? 'field-check field-check--ok' : 'field-check field-check--missing'}
              >
                <code>{field}</code>
                <span>{preview.optional[field] ? '있음' : '없음 (선택)'}</span>
              </li>
            ))}
          </ul>

          {allFailed ? (
            <p className="upload-preview__warn" role="alert">
              처음 줄들이 모두 형식에 맞지 않아요. 이대로 올리면 처리에 실패할 수 있어요.
            </p>
          ) : (
            missingOptional.length > 0 && (
              <ul className="upload-preview__notes" aria-label="정확도 안내">
                {missingOptional.map((field) => (
                  <li key={field}>
                    <code>{field}</code>가 없어요. {MISSING_OPTIONAL[field]}
                  </li>
                ))}
              </ul>
            )
          )}

          <ol className="upload-preview__lines" aria-label="파일 앞부분">
            {preview.lines.map((line) => (
              <li key={line.number} className={line.error ? 'upload-preview__line--bad' : undefined}>
                <code>{line.text || ' '}</code>
                {line.error && <span className="upload-preview__reason">{line.error}</span>}
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="upload-preview__actions">
        <button type="button" className="button button--primary" onClick={onUpload} disabled={preview === null}>
          올리기
        </button>
        <button type="button" className="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </section>
  )
}
