import { Link, useParams } from 'react-router'
import { isInProgress, type UploadSummary } from '../api/uploads'
import Icon from '../components/Icon'
import { ErrorMessage } from '../components/QueryState'
import { SkeletonRows } from '../components/Skeleton'
import { useUploads } from '../features/uploads/queries'
import { StatusBadge } from '../features/uploads/StatusBadge'
import { formatDateTime } from '../lib/format'

const numberFormat = new Intl.NumberFormat('ko-KR')
const n = (value: number) => numberFormat.format(value)
const RECENT = 5

/**
 * 개요: 로그가 없으면 처음 할 일을 단계로, 있으면 올린 로그 요약과 다음 할 일을 보여 준다.
 * 분석 결과(히트율, 엔드포인트 수)는 분석 API(B11)가 생기면 여기에 더한다. 그전에는 빈 숫자를 보여 주지 않는다.
 */
export default function ProjectOverviewPage() {
  const projectId = Number(useParams().projectId)
  const uploads = useUploads(projectId)

  if (uploads.isPending) return <SkeletonRows label="프로젝트 현황을 불러오는 중…" />
  if (uploads.isError) return <ErrorMessage error={uploads.error} onRetry={() => uploads.refetch()} />
  if (uploads.data.length === 0) return <SetupGuide projectId={projectId} />

  return <Summary projectId={projectId} uploads={uploads.data} />
}

function SetupGuide({ projectId }: { projectId: number }) {
  return (
    <section className="setup" aria-labelledby="setup-title">
      <h2 id="setup-title" className="section-title">
        시작하기
      </h2>
      <ol className="setup__steps">
        <li className="setup__step setup__step--current">
          <div>
            <h3 className="setup__name">로그 올리기</h3>
            <p className="setup__text">
              API 액세스 로그를 JSON Lines 파일로 올려요. 올리기 전에 필드를 미리 확인해 드려요.
            </p>
          </div>
          <Link to={`/projects/${projectId}/logs`} className="button button--primary">
            로그 올리기
          </Link>
        </li>
        <li className="setup__step">
          <div>
            <h3 className="setup__name">정책 정하기 (선택)</h3>
            <p className="setup__text">경로를 묶는 패턴과, 데이터가 늦게 반영돼도 괜찮은 시간을 정해요.</p>
          </div>
          <span className="setup__soon">준비 중</span>
        </li>
        <li className="setup__step">
          <div>
            <h3 className="setup__name">분석 실행</h3>
            <p className="setup__text">엔드포인트마다 추천 TTL과 그 근거를 받아요.</p>
          </div>
          <span className="setup__soon">준비 중</span>
        </li>
      </ol>
    </section>
  )
}

function Summary({ projectId, uploads }: { projectId: number; uploads: UploadSummary[] }) {
  const parsed = uploads.filter((upload) => upload.status === 'PARSED')
  const requests = parsed.reduce((sum, upload) => sum + (upload.totalLines ?? 0) - upload.errorLines, 0)
  const skipped = parsed.reduce((sum, upload) => sum + upload.errorLines, 0)
  const starts = parsed.map((upload) => upload.rangeStart).filter((value): value is string => value !== null)
  const ends = parsed.map((upload) => upload.rangeEnd).filter((value): value is string => value !== null)
  const rangeStart = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : null
  const rangeEnd = ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : null
  const logsPath = `/projects/${projectId}/logs`

  return (
    <div className="stack overview">
      <NextStep uploads={uploads} skipped={skipped} logsPath={logsPath} />

      <dl className="stat-strip" aria-label="올린 로그 요약">
        <div className="stat">
          <dt>읽은 요청</dt>
          <dd>{n(requests)}</dd>
        </div>
        <div className="stat">
          <dt>로그 기간</dt>
          <dd className="stat__text">
            {rangeStart && rangeEnd ? (
              <>
                <time dateTime={rangeStart}>{formatDateTime(rangeStart)}</time> ~{' '}
                <time dateTime={rangeEnd}>{formatDateTime(rangeEnd)}</time>
              </>
            ) : (
              '처리 중'
            )}
          </dd>
        </div>
        <div className="stat">
          <dt>올린 파일</dt>
          <dd>{n(uploads.length)}개</dd>
        </div>
        <div className="stat">
          <dt>읽지 못한 줄</dt>
          <dd>{n(skipped)}</dd>
        </div>
      </dl>

      <section className="stack" aria-labelledby="recent-title">
        <div className="section-head">
          <h2 id="recent-title" className="section-title">
            최근 업로드
          </h2>
          <Link to={logsPath}>모두 보기</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">파일</th>
              <th scope="col">상태</th>
              <th scope="col" className="data-table__num">
                줄 수
              </th>
              <th scope="col">올린 시각</th>
            </tr>
          </thead>
          <tbody>
            {uploads.slice(0, RECENT).map((upload) => (
              <tr key={upload.id}>
                <th scope="row" className="data-table__mono">
                  {upload.filename}
                </th>
                <td>
                  <StatusBadge status={upload.status} />
                </td>
                <td className="data-table__num">{n(upload.totalLines ?? upload.processedLines)}</td>
                <td className="data-table__muted">
                  <time dateTime={upload.createdAt}>{formatDateTime(upload.createdAt)}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

/** 상태에 따라 바뀌는 한 줄 안내 */
function NextStep({ uploads, skipped, logsPath }: { uploads: UploadSummary[]; skipped: number; logsPath: string }) {
  const latest = uploads[0]
  if (uploads.some((upload) => isInProgress(upload.status))) {
    return (
      <p className="next-step" role="status">
        로그를 처리하고 있어요. 끝나면 이 화면이 바뀌어요.
      </p>
    )
  }
  if (latest.status === 'FAILED') {
    return (
      <p className="next-step next-step--error">
        <Icon name="alert" />
        <span>
          최근 업로드 {latest.filename}을(를) 처리하지 못했어요. <Link to={logsPath}>사유 확인하기</Link>
        </span>
      </p>
    )
  }
  if (skipped > 0) {
    return (
      <p className="next-step next-step--warn">
        읽지 못한 줄이 {n(skipped)}줄 있어요. 분석에서는 빠져요. <Link to={logsPath}>실패한 줄 보기</Link>
      </p>
    )
  }
  return <p className="next-step">로그 준비가 끝났어요. 정책 설정과 분석 실행은 준비 중이에요.</p>
}
