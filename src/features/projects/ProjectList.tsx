import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { ProjectSummary } from '../../api/projects'
import { formatDateTime } from '../../lib/format'

type Sort = 'recent' | 'name'

const collator = new Intl.Collator('ko-KR', { numeric: true })

/** 지금 할 일 기준의 상태. 분석 결과(엔드포인트 수, 히트율)는 분석 API가 생기면 열을 더한다 */
function statusOf(project: ProjectSummary): { label: string; tone: 'need' | 'ready' | 'done' } {
  if (project.uploadCount === 0) return { label: '로그 필요', tone: 'need' }
  if (project.latestAnalysisId === null) return { label: '분석 전', tone: 'ready' }
  return { label: '분석 있음', tone: 'done' }
}

export default function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')

  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko-KR')
    const filtered = needle
      ? projects.filter((project) => project.name.toLocaleLowerCase('ko-KR').includes(needle))
      : projects
    return [...filtered].sort((a, b) =>
      sort === 'name' ? collator.compare(a.name, b.name) : b.createdAt.localeCompare(a.createdAt),
    )
  }, [projects, query, sort])

  if (projects.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">아직 프로젝트가 없습니다</p>
        <p className="muted">위에서 분석할 서비스 이름으로 첫 프로젝트를 만들고, 접근 로그를 올려 보세요.</p>
      </div>
    )
  }

  return (
    <div className="stack project-table-wrap">
      <div className="list-toolbar">
        <input
          type="search"
          className="input list-toolbar__search"
          placeholder="이름으로 찾기"
          aria-label="프로젝트 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="list-toolbar__sort">
          <span className="muted">정렬</span>
          <select className="input" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="recent">최근 만든 순</option>
            <option value="name">이름순</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="muted list-toolbar__none" role="status">
          ‘{query.trim()}’와 맞는 프로젝트가 없어요.
        </p>
      ) : (
        <table className="project-table" aria-label="프로젝트 목록">
          <thead>
            <tr>
              <th scope="col">프로젝트</th>
              <th scope="col">상태</th>
              <th scope="col" className="project-table__num">
                업로드
              </th>
              <th scope="col">만든 날</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((project) => {
              const status = statusOf(project)
              return (
                <tr key={project.id}>
                  <th scope="row">
                    <Link to={`/projects/${project.id}`} className="project-table__name">
                      {project.name}
                    </Link>
                  </th>
                  <td>
                    <span className={`project-status project-status--${status.tone}`}>{status.label}</span>
                  </td>
                  <td className="project-table__num">{project.uploadCount}개</td>
                  <td className="project-table__date">
                    <time dateTime={project.createdAt}>{formatDateTime(project.createdAt)}</time>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
