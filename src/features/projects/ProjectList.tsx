import { Link } from 'react-router'
import type { ProjectSummary } from '../../api/projects'
import { formatDateTime } from '../../lib/format'

export default function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return (
      <div className="card empty">
        <p className="empty__title">아직 프로젝트가 없습니다</p>
        <p className="muted">분석할 서비스 이름으로 프로젝트를 만들고, 접근 로그를 올려 TTL 추천을 받아 보세요.</p>
      </div>
    )
  }

  return (
    <ul className="project-list" aria-label="프로젝트 목록">
      {projects.map((project) => (
        <li key={project.id} className="card project-item">
          <Link to={`/projects/${project.id}`} className="project-item__name">
            {project.name}
          </Link>
          <dl className="project-item__meta">
            <div>
              <dt>업로드</dt>
              <dd>{project.uploadCount}개</dd>
            </div>
            <div>
              <dt>분석</dt>
              <dd>{project.latestAnalysisId === null ? '없음' : '있음'}</dd>
            </div>
            <div>
              <dt>생성</dt>
              <dd>
                <time dateTime={project.createdAt}>{formatDateTime(project.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}
