import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorMessage, Loading } from '../../components/QueryState'
import { authKeys, useMe } from './queries'

/** 로그인한 사용자만 하위 화면을 본다. 아니면 로그인 화면으로 보내고, 로그인 후 지금 화면으로 돌아온다. */
export default function RequireAuth() {
  const me = useMe()
  const location = useLocation()
  const queryClient = useQueryClient()

  if (me.isPending) return <Loading label="로그인 상태를 확인하는 중…" />
  if (me.isError) return <ErrorMessage error={me.error} onRetry={() => me.refetch()} />
  if (!me.data) {
    // 직접 로그아웃했으면 소개 화면으로 보낸다(돌아갈 주소를 남기지 않는다). 세션 만료면 다시 로그인한 뒤 보던 화면으로 돌아온다.
    if (queryClient.getQueryData(authKeys.loggedOutByUser) === true) return <Navigate to="/" replace />
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}
