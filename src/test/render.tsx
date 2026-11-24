import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createQueryClient } from '../app/queryClient'
import { routes } from '../app/routes'

/**
 * 실제 라우트 구성과 실제 QueryClient 설정(세션 만료 처리 포함)으로 특정 경로를 렌더링한다.
 * 재시도만 꺼서 실패를 바로 확인한다.
 */
export function renderRoute(path: string) {
  const queryClient = createQueryClient()
  const defaults = queryClient.getDefaultOptions()
  queryClient.setDefaultOptions({
    queries: { ...defaults.queries, retry: false },
    mutations: { ...defaults.mutations, retry: false },
  })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}
