import { useId, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useDeleteProject, useProject } from '../features/projects/queries'
import { useToast } from '../features/toast/context'

/** 설정: 지금은 프로젝트 삭제만. 이름을 그대로 입력해야 지울 수 있다 */
export default function ProjectSettingsPage() {
  const projectId = Number(useParams().projectId)
  const project = useProject(projectId)
  const remove = useDeleteProject(projectId)
  const navigate = useNavigate()
  const toast = useToast()
  const inputId = useId()
  const [typed, setTyped] = useState('')

  // 위 레이아웃이 불러오기를 끝낸 뒤에만 그려진다
  const name = project.data?.name ?? ''
  const matches = typed === name

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!matches || remove.isPending) return
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.show(`${name} 프로젝트를 지웠어요.`, 'success')
        navigate('/projects', { replace: true })
      },
    })
  }

  const error = remove.error
    ? remove.error instanceof ApiError && remove.error.status === 409
      ? '처리 중인 업로드나 분석이 있어서 지금은 지울 수 없어요. 끝난 뒤 다시 시도해 주세요.'
      : remove.error instanceof ApiError
        ? remove.error.message
        : '프로젝트를 지우지 못했어요.'
    : null

  return (
    <section className="danger-zone" aria-labelledby="delete-title">
      <h2 id="delete-title" className="section-title">
        프로젝트 삭제
      </h2>
      <p className="muted">
        올린 로그, 정책, 분석 결과까지 모두 지워지고 되돌릴 수 없어요. 처리 중인 업로드가 있으면 지울 수 없어요.
      </p>
      <form className="danger-zone__form" onSubmit={handleSubmit} noValidate>
        <label htmlFor={inputId} className="field__label">
          확인을 위해 <strong>{name}</strong>을(를) 입력하세요
        </label>
        <div className="danger-zone__row">
          <input
            id={inputId}
            className="input"
            value={typed}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
          <button type="submit" className="button button--danger" disabled={!matches || remove.isPending}>
            {remove.isPending ? '지우는 중…' : '프로젝트 삭제'}
          </button>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  )
}
