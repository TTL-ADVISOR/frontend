import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUpload, isInProgress, listUploads, uploadLog, type UploadSummary } from '../../api/uploads'
import { projectKeys } from '../projects/queries'

/** 처리 중인 업로드를 다시 확인하는 간격 */
export const DETAIL_POLL_MS = 1000
const LIST_POLL_MS = 3000

export const uploadKeys = {
  list: (projectId: number) => ['projects', projectId, 'uploads'] as const,
  detail: (uploadId: number) => ['uploads', uploadId] as const,
}

/** 업로드 이력. 처리 중인 업로드가 있으면 상태가 바뀌는 걸 보도록 주기적으로 다시 불러온다. */
export function useUploads(projectId: number) {
  return useQuery({
    queryKey: uploadKeys.list(projectId),
    queryFn: () => listUploads(projectId),
    refetchInterval: (query) =>
      query.state.data?.some((upload) => isInProgress(upload.status)) ? LIST_POLL_MS : false,
  })
}

/** 업로드 한 건. 끝날 때까지(PARSED·FAILED) 1초마다 다시 불러오고, 끝나면 이력과 프로젝트 정보를 갱신한다. */
export function useUpload(uploadId: number | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: uploadKeys.detail(uploadId ?? 0),
    enabled: uploadId !== undefined,
    queryFn: async () => {
      const upload = await getUpload(uploadId!)
      if (!isInProgress(upload.status)) {
        const cached = queryClient
          .getQueryData<UploadSummary[]>(uploadKeys.list(upload.projectId))
          ?.find((item) => item.id === upload.id)
        if (cached && cached.status !== upload.status) {
          void queryClient.invalidateQueries({ queryKey: uploadKeys.list(upload.projectId) })
        }
      }
      return upload
    },
    refetchInterval: (query) => (query.state.data && isInProgress(query.state.data.status) ? DETAIL_POLL_MS : false),
  })
}

export function useUploadLog(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (ratio: number) => void }) =>
      uploadLog(projectId, file, onProgress),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: uploadKeys.list(projectId) }),
        // 프로젝트 목록의 업로드 개수
        queryClient.invalidateQueries({ queryKey: projectKeys.all, exact: true }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId), exact: true }),
      ]),
  })
}
