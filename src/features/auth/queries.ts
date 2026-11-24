import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMe, isSessionExpired, login, logout, signup, type SignupInput, type User } from '../../api/auth'

export const authKeys = {
  me: ['auth', 'me'] as const,
  /** 사용자가 직접 로그아웃했는지. RequireAuth가 세션 만료와 구분하는 데 쓴다. */
  loggedOutByUser: ['auth', 'loggedOutByUser'] as const,
}

/** 로그인 사용자. null이면 로그인하지 않은 상태다. 로그인·로그아웃·세션 만료 때만 바뀐다. */
export function useMe() {
  return useQuery({ queryKey: authKeys.me, queryFn: fetchMe, staleTime: Infinity, retry: false })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (user) => signedIn(queryClient, user),
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SignupInput) => signup(input),
    onSuccess: (user) => signedIn(queryClient, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const loggedOut = () => {
    // 직접 로그아웃했다고 먼저 표시한다. RequireAuth는 이 표시를 보고 ?next= 없이 로그인 화면으로 보낸다
    // (세션 만료와 달리, 다음에 로그인하는 사람이 이전 사용자의 화면으로 돌아가면 안 된다).
    // 화면 이동 순서에 기대지 않는다: navigate()는 우선순위가 낮은 전환이라, 로그인 상태를 비우는
    // 갱신이 먼저 그려져 RequireAuth가 ?next=를 붙인 채 이동하는 일이 실제 브라우저에서 있었다.
    queryClient.setQueryData(authKeys.loggedOutByUser, true)
    // 다른 사용자의 데이터가 남지 않도록 로그인 상태를 뺀 캐시를 모두 지운다.
    // queryClient.clear()는 쓰지 않는다: 로그인 상태 쿼리까지 지우면 화면이 보고 있던 쿼리와 끊겨
    // 로그아웃을 알아채지 못한다.
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] })
    queryClient.setQueryData(authKeys.me, null)
    // 서버에 로그인 상태를 다시 물어, 로그아웃으로 지워진 CSRF 쿠키를 새로 받아 둔다
    void queryClient.invalidateQueries({ queryKey: authKeys.me })
  }
  return useMutation({
    mutationFn: logout,
    onSuccess: loggedOut,
    // 이미 세션이 끝난 경우만 로그아웃된 것으로 본다. 네트워크·서버 오류면 서버 세션이 살아 있으므로
    // 화면만 로그아웃시키지 않고 로그인 상태를 유지한 채 실패를 알린다.
    onError: (error) => {
      if (isSessionExpired(error)) loggedOut()
    },
  })
}

function signedIn(queryClient: ReturnType<typeof useQueryClient>, user: User) {
  // 이전 사용자(또는 로그인 전)의 캐시를 버리고 새 사용자로 시작한다
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] })
  queryClient.setQueryData(authKeys.loggedOutByUser, false)
  queryClient.setQueryData(authKeys.me, user)
}
