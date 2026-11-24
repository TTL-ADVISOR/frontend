import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { authKeys } from '../features/auth/queries'

const MAX_RETRIES = 2

/** 4xx는 다시 보내도 같으므로 재시도하지 않는다. 5xx와 네트워크 오류만 최대 2번. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isClientError) return false
  return failureCount < MAX_RETRIES
}

/** 세션이 만료됐거나 로그아웃된 상태로 API를 부른 경우. 로그인 실패(INVALID_CREDENTIALS)와는 구분한다. */
export function isSessionExpired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHORIZED'
}

export function createQueryClient(): QueryClient {
  // 어느 API에서든 세션 만료가 오면 로그인 상태를 비운다 → RequireAuth가 로그인 화면으로 보낸다
  const onError = (error: unknown) => {
    if (isSessionExpired(error)) queryClient.setQueryData(authKeys.me, null)
  }
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        refetchOnWindowFocus: false,
        staleTime: 10_000,
      },
      mutations: {
        retry: false,
      },
    },
  })
  return queryClient
}
