import { apiFetch } from './client'

/** 1-1 생성 응답 */
export interface Project {
  id: number
  name: string
  createdAt: string
}

/** 1-2 목록, 1-3 단건 응답 */
export interface ProjectSummary extends Project {
  uploadCount: number
  latestAnalysisId: number | null
}

export const PROJECT_NAME_MAX = 100

export function listProjects(): Promise<ProjectSummary[]> {
  return apiFetch('/projects')
}

export function getProject(projectId: number): Promise<ProjectSummary> {
  return apiFetch(`/projects/${projectId}`)
}

export function createProject(name: string): Promise<Project> {
  return apiFetch('/projects', { method: 'POST', body: { name } })
}

/** 1-4 삭제. 하위 업로드·요청 로그·분석 결과까지 지운다. 처리 중인 작업이 있으면 409 RESOURCE_BUSY */
export function deleteProject(projectId: number): Promise<void> {
  return apiFetch(`/projects/${projectId}`, { method: 'DELETE' })
}
