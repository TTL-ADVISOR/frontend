import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { PROJECT_NAME_MAX, type Project } from '../../api/projects'
import { useCreateProject } from './queries'
import { validateProjectName } from './validation'

interface Props {
  onCreated: (project: Project) => void
}

export default function CreateProjectForm({ onCreated }: Props) {
  const [name, setName] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const mutation = useCreateProject()

  const serverError = mutation.error ? fieldErrorOf(mutation.error) : null
  const error = clientError ?? serverError

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = validateProjectName(name)
    setClientError(invalid)
    if (invalid) return
    mutation.mutate(name.trim(), {
      onSuccess: (project) => {
        setName('')
        onCreated(project)
      },
    })
  }

  return (
    <form className="card create-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="project-name" className="create-form__label">
        새 프로젝트
      </label>
      <div className="create-form__row">
        <input
          id="project-name"
          className="input"
          value={name}
          placeholder="예: 쇼핑몰 백엔드"
          maxLength={PROJECT_NAME_MAX}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'project-name-hint project-name-error' : 'project-name-hint'}
          onChange={(e) => {
            setName(e.target.value)
            if (clientError) setClientError(null)
          }}
        />
        <button type="submit" className="button button--primary" disabled={mutation.isPending}>
          {mutation.isPending ? '만드는 중…' : '만들기'}
        </button>
      </div>
      <p id="project-name-hint" className="create-form__hint">
        서비스(서버) 하나당 프로젝트 하나예요. 만든 뒤 그 서비스의 접근 로그를 올리면 API별로 TTL을 추천해 드려요.
      </p>
      {error && (
        <p id="project-name-error" className="field-error">
          {error}
        </p>
      )}
    </form>
  )
}

/** 서버 검증 오류면 name 필드 사유를, 그 밖의 오류면 일반 메시지를 보여 준다. */
function fieldErrorOf(error: Error): string {
  if (error instanceof ApiError) {
    const fieldReason = error.details.name
    return typeof fieldReason === 'string' ? fieldReason : error.message
  }
  return '프로젝트를 만들지 못했습니다.'
}
