import type { RouteObject } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Layout from '../components/Layout'
import RequireAuth from '../features/auth/RequireAuth'
import ErrorPage from '../pages/ErrorPage'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProjectLayout from '../pages/ProjectLayout'
import ProjectLogsPage from '../pages/ProjectLogsPage'
import ProjectOverviewPage from '../pages/ProjectOverviewPage'
import ProjectSettingsPage from '../pages/ProjectSettingsPage'
import ProjectsPage from '../pages/ProjectsPage'
import SignupPage from '../pages/SignupPage'

export const routes: RouteObject[] = [
  // 서비스 소개. 로그인하지 않아도 볼 수 있다
  { path: '/', element: <LandingPage />, errorElement: <ErrorPage /> },
  {
    // 로그인·회원가입은 앱 헤더 없이 전용 화면으로 보여 준다
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        // 아래 화면은 로그인해야 볼 수 있다
        element: <RequireAuth />,
        children: [
          { path: 'projects', element: <ProjectsPage /> },
          {
            // 프로젝트 워크스페이스: 개요 · 로그 · 설정 (정책 · 분석은 API가 생기면 더한다)
            path: 'projects/:projectId',
            element: <ProjectLayout />,
            children: [
              { index: true, element: <ProjectOverviewPage /> },
              { path: 'logs', element: <ProjectLogsPage />, handle: { crumb: '로그' } },
              { path: 'settings', element: <ProjectSettingsPage />, handle: { crumb: '설정' } },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
