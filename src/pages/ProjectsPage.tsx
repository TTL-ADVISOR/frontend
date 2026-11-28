import { useNavigate } from 'react-router'
import { ErrorMessage } from '../components/QueryState'
import { SkeletonRows } from '../components/Skeleton'
import CreateProjectForm from '../features/projects/CreateProjectForm'
import ProjectList from '../features/projects/ProjectList'
import { useProjects } from '../features/projects/queries'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const projects = useProjects()

  return (
    <section className="stack page">
      <header className="page-head">
        <h1 className="page-head__title">프로젝트</h1>
        <p className="muted">분석할 서비스를 프로젝트로 만들고 접근 로그를 올려 보세요.</p>
      </header>

      {/* 만든 뒤에는 바로 로그를 올릴 수 있도록 프로젝트 화면으로 이동한다 */}
      <CreateProjectForm onCreated={(project) => navigate(`/projects/${project.id}`)} />

      {projects.isPending ? (
        <SkeletonRows label="프로젝트를 불러오는 중…" />
      ) : projects.isError ? (
        <ErrorMessage error={projects.error} onRetry={() => projects.refetch()} />
      ) : (
        <ProjectList projects={projects.data} />
      )}
    </section>
  )
}
