import {
  API_BASE,
  ApiError,
  apiFetch,
  CSRF_COOKIE,
  CSRF_HEADER,
  parseErrorBody,
  readCookie,
  refreshCsrfToken,
} from './client'
import { CLIENT_ERROR_CODES } from './types'

export type UploadStatus = 'UPLOADED' | 'PARSING' | 'PARSED' | 'FAILED'

export interface ErrorSample {
  line: number
  reason: string
}

/** 2-2 목록 항목. 2-3 상태 조회는 errorSamples가 더 붙는다. */
export interface UploadSummary {
  id: number
  projectId: number
  filename: string
  status: UploadStatus
  processedLines: number
  /** 파싱이 끝나기 전에는 null */
  totalLines: number | null
  errorLines: number
  rangeStart: string | null
  rangeEnd: string | null
  failureReason: string | null
  createdAt: string
}

export interface UploadDetail extends UploadSummary {
  errorSamples: ErrorSample[]
}

export interface UploadAccepted {
  id: number
  status: UploadStatus
}

/** 서버(multipart 한도 100MB)와 같은 기준. Spring의 MB는 1024×1024바이트다. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const ALLOWED_EXTENSIONS = ['jsonl', 'log', 'txt'] as const

export function isInProgress(status: UploadStatus): boolean {
  return status === 'UPLOADED' || status === 'PARSING'
}

export function listUploads(projectId: number): Promise<UploadSummary[]> {
  return apiFetch(`/projects/${projectId}/uploads`)
}

export function getUpload(uploadId: number): Promise<UploadDetail> {
  return apiFetch(`/uploads/${uploadId}`)
}

/**
 * 로그 파일을 올린다. 전송 진행률을 알려면 업로드 진행 이벤트가 필요해서 fetch 대신 XMLHttpRequest를 쓴다.
 * CSRF 토큰 처리와 에러 형식은 apiFetch와 같다.
 */
export async function uploadLog(
  projectId: number,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<UploadAccepted> {
  try {
    return await sendFile(projectId, file, onProgress)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CSRF_TOKEN_INVALID') {
      await refreshCsrfToken()
      return sendFile(projectId, file, onProgress)
    }
    throw error
  }
}

function sendFile(projectId: number, file: File, onProgress?: (ratio: number) => void): Promise<UploadAccepted> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/projects/${projectId}/uploads`)
    xhr.setRequestHeader('Accept', 'application/json')
    const csrfToken = readCookie(CSRF_COOKIE)
    if (csrfToken) xhr.setRequestHeader(CSRF_HEADER, csrfToken)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadAccepted)
        } catch {
          reject(new ApiError(xhr.status, parseErrorBody(xhr.status, '')))
        }
        return
      }
      reject(new ApiError(xhr.status, parseErrorBody(xhr.status, xhr.responseText)))
    }
    xhr.onerror = () =>
      reject(
        new ApiError(0, {
          code: CLIENT_ERROR_CODES.NETWORK_ERROR,
          message: '서버에 연결할 수 없습니다.',
          details: {},
        }),
      )

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
