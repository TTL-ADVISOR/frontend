/** 백엔드 공통 에러 응답 (API.md "에러 응답"). */
export interface ErrorResponse {
  code: string
  message: string
  details: Record<string, unknown>
}

/** 서버 응답이 없거나 형식을 알 수 없을 때 쓰는 클라이언트 측 코드. */
export const CLIENT_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const
