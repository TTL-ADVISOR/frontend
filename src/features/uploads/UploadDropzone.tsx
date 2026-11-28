import { useId, useRef, useState, type DragEvent } from 'react'
import { ApiError } from '../../api/client'
import type { UploadAccepted } from '../../api/uploads'
import { readPreview, type LogPreview } from './preview'
import { useUploadLog } from './queries'
import UploadPreview from './UploadPreview'
import { validateLogFile } from './validation'

interface Props {
  projectId: number
  onAccepted: (upload: UploadAccepted) => void
}

/**
 * 로그 파일을 끌어다 놓거나 고른 뒤, 앞부분 미리보기와 필드 확인을 보고 올린다.
 * 전송 중에는 몇 %를 보냈는지 보여 준다.
 */
export default function UploadDropzone({ projectId, onAccepted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const errorId = useId()
  const [dragging, setDragging] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [sending, setSending] = useState<string | null>(null)
  const [picked, setPicked] = useState<{ file: File; preview: LogPreview | null } | null>(null)
  const mutation = useUploadLog(projectId)

  const error = clientError ?? (mutation.error ? uploadErrorMessage(mutation.error) : null)

  function pick(file: File | undefined) {
    if (!file || mutation.isPending) return
    const invalid = validateLogFile(file)
    setClientError(invalid)
    mutation.reset()
    if (invalid) {
      setPicked(null)
      return
    }
    setPicked({ file, preview: null })
    readPreview(file)
      .catch((): LogPreview => ({
        lines: [],
        required: { ts: null, method: null, path: null, status: null },
        optional: { latencyMs: false, size: false, respHash: false },
      }))
      // 읽는 사이 다른 파일을 골랐으면 버린다
      .then((preview) => setPicked((current) => (current?.file === file ? { file, preview } : current)))
  }

  function upload(file: File) {
    setPicked(null)
    setProgress(0)
    setSending(file.name)
    mutation.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: onAccepted,
        onSettled: () => setSending(null),
      },
    )
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    pick(event.dataTransfer.files[0])
  }

  const percent = Math.round(progress * 100)

  if (picked && !sending) {
    return (
      <UploadPreview
        file={picked.file}
        preview={picked.preview}
        onUpload={() => upload(picked.file)}
        onCancel={() => setPicked(null)}
      />
    )
  }

  return (
    <div className="stack upload">
      <div
        className={`dropzone${dragging ? ' dropzone--active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!mutation.isPending) setDragging(true)
        }}
        onDragLeave={(event) => {
          // 안쪽 요소(버튼 등)로 옮겨 갈 때도 dragleave가 나므로, 영역 밖으로 나갔을 때만 끈다
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={handleDrop}
      >
        {sending ? (
          <div className="dropzone__sending" role="status">
            <p className="dropzone__title">{sending} 올리는 중… {percent}%</p>
            <progress className="progress" max={100} value={percent} aria-label="파일 전송 진행률" />
          </div>
        ) : (
          <>
            <p className="dropzone__title">로그 파일을 여기에 끌어다 놓으세요</p>
            <p id={hintId} className="muted dropzone__hint">
              JSON Lines 형식(.jsonl, .log, .txt) · 최대 100MB · 100만 줄
            </p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => inputRef.current?.click()}
              aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            >
              파일 선택
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jsonl,.log,.txt"
          hidden
          data-testid="upload-input"
          onChange={(event) => {
            pick(event.target.files?.[0])
            // 같은 파일을 다시 골라도 change가 나도록 비운다
            event.target.value = ''
          }}
        />
      </div>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function uploadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return '알 수 없는 오류가 발생했습니다.'
  switch (error.status) {
    case 413:
      return '파일은 100MB를 넘을 수 없습니다.'
    case 503:
      return '처리 중인 작업이 많습니다. 잠시 후 다시 시도해 주세요.'
    default:
      return error.message
  }
}
