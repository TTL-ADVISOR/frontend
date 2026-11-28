import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { ErrorMessage, Loading } from '../components/QueryState'
import { useProject } from '../features/projects/queries'
import UploadSection from '../features/uploads/UploadSection'
import { formatDateTime } from '../lib/format'

/** 프로젝트 화면: 로그 업로드(F3). 정책 관리(F4)가 여기에 붙는다. */
export default function ProjectDetailPage() {
  const projectId = Number(useParams().projectId)
  const project = useProject(projectId)

  if (project.isPending) return <Loading />
  if (project.isError) {
    if (project.error instanceof ApiError && project.error.status === 404) {
      return (
        <section className="stack">
          <h1>프로젝트를 찾을 수 없습니다</h1>
          <Link to="/projects">프로젝트 목록으로</Link>
        </section>
      )
    }
    return <ErrorMessage error={project.error} onRetry={() => project.refetch()} />
  }

  return (
    <section className="stack">
      <nav>
        <Link to="/projects">← 프로젝트 목록</Link>
      </nav>
      <header>
        <h1>{project.data.name}</h1>
        <p className="muted">
          <time dateTime={project.data.createdAt}>{formatDateTime(project.data.createdAt)}</time>에 만듦
        </p>
      </header>
      {/* 프로젝트가 바뀌면 고른 업로드 같은 화면 상태를 새로 시작한다 */}
      <UploadSection key={projectId} projectId={projectId} />
    </section>
  )
}
