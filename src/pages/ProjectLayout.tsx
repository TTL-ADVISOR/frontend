import { Link, Outlet, useMatches, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { ErrorMessage, Loading } from '../components/QueryState'
import { useProject } from '../features/projects/queries'
import { formatDateTime } from '../lib/format'

/** 하위 화면 이름. 라우트의 handle.crumb로 정한다 */
interface CrumbHandle {
  crumb?: string
}

/**
 * 프로젝트 워크스페이스: 위치 표시와 제목은 여기서, 내용(개요·로그·설정)은 하위 화면에서 그린다.
 * 메뉴는 사이드바에 있다.
 */
export default function ProjectLayout() {
  const projectId = Number(useParams().projectId)
  const project = useProject(projectId)
  const crumb = useMatches()
    .map((match) => (match.handle as CrumbHandle | undefined)?.crumb)
    .findLast(Boolean)

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
    <section className="stack page workspace">
      <header className="page-head">
        <nav aria-label="현재 위치" className="breadcrumb">
          <ol>
            <li>
              <Link to="/projects">프로젝트</Link>
            </li>
            <li aria-current={crumb ? undefined : 'page'}>
              {crumb ? <Link to={`/projects/${projectId}`}>{project.data.name}</Link> : project.data.name}
            </li>
            {crumb && <li aria-current="page">{crumb}</li>}
          </ol>
        </nav>
        <h1 className="page-head__title">{project.data.name}</h1>
        <p className="muted page-head__meta">
          <time dateTime={project.data.createdAt}>{formatDateTime(project.data.createdAt)}</time>에 만듦 · 업로드{' '}
          {project.data.uploadCount}개
        </p>
      </header>
      {/* 프로젝트가 바뀌면 고른 업로드 같은 화면 상태를 새로 시작한다 */}
      <Outlet key={projectId} />
    </section>
  )
}
