import { Navigate, type RouteObject } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Layout from '../components/Layout'
import RequireAuth from '../features/auth/RequireAuth'
import ErrorPage from '../pages/ErrorPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'
import ProjectsPage from '../pages/ProjectsPage'
import SignupPage from '../pages/SignupPage'

export const routes: RouteObject[] = [
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
          { index: true, element: <Navigate to="/projects" replace /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:projectId', element: <ProjectDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
