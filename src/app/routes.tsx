import { Navigate, type RouteObject } from 'react-router'
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
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
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
