import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { ApiError } from '../api/client'

/** 렌더링 중 예상하지 못한 오류가 나면 보여 주는 화면. */
export default function ErrorPage() {
  const error = useRouteError()
  const message =
    error instanceof ApiError
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : '알 수 없는 오류가 발생했습니다.'

  return (
    <section role="alert">
      <h1>문제가 발생했습니다</h1>
      <p>{message}</p>
      <Link to="/projects">프로젝트 목록으로</Link>
    </section>
  )
}
