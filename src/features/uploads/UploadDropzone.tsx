import { useId, useRef, useState, type DragEvent } from 'react'
import { ApiError } from '../../api/client'
import type { UploadAccepted } from '../../api/uploads'
import { useUploadLog } from './queries'
import { validateLogFile } from './validation'

interface Props {
  projectId: number
  onAccepted: (upload: UploadAccepted) => void
}

/** 로그 파일을 끌어다 놓거나 골라서 올린다. 전송 중에는 몇 %를 보냈는지 보여 준다. */
export default function UploadDropzone({ projectId, onAccepted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const errorId = useId()
  const [dragging, setDragging] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [sending, setSending] = useState<string | null>(null)
  const mutation = useUploadLog(projectId)

  const error = clientError ?? (mutation.error ? uploadErrorMessage(mutation.error) : null)

  function start(file: File | undefined) {
    if (!file || mutation.isPending) return
    const invalid = validateLogFile(file)
    setClientError(invalid)
    mutation.reset()
    if (invalid) return
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
    start(event.dataTransfer.files[0])
  }

  const percent = Math.round(progress * 100)

  return (
    <div className="stack upload">
      <div
        className={`dropzone${dragging ? ' dropzone--active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!mutation.isPending) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
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
            start(event.target.files?.[0])
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
