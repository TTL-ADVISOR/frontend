import { Navigate, type RouteObject } from 'react-router'
import Layout from '../components/Layout'
import ErrorPage from '../pages/ErrorPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'
import ProjectsPage from '../pages/ProjectsPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
