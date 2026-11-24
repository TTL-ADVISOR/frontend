import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { fetchMe, login, logout, signup, type SignupInput, type User } from '../../api/auth'

export const authKeys = {
  me: ['auth', 'me'] as const,
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
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // 먼저 로그인 화면으로 옮긴다. 상태를 먼저 비우면 RequireAuth가 보던 화면을 ?next=로 남긴 채 보내서,
      // 다음에 로그인하는 사람이 이전 사용자의 화면으로 가게 된다.
      navigate('/login', { replace: true })
      // 다른 사용자의 데이터가 남지 않도록 로그인 상태를 뺀 캐시를 모두 지운다.
      // queryClient.clear()는 쓰지 않는다: 로그인 상태 쿼리까지 지우면 화면이 보고 있던 쿼리와 끊겨
      // 로그아웃을 알아채지 못한다.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] })
      queryClient.setQueryData(authKeys.me, null)
      // 서버에 로그인 상태를 다시 물어, 로그아웃으로 지워진 CSRF 쿠키를 새로 받아 둔다
      void queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

function signedIn(queryClient: ReturnType<typeof useQueryClient>, user: User) {
  // 이전 사용자(또는 로그인 전)의 캐시를 버리고 새 사용자로 시작한다
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] })
  queryClient.setQueryData(authKeys.me, user)
}
