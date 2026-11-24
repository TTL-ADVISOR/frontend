import { CLIENT_ERROR_CODES, type ErrorResponse } from './types'

/**
 * API 호출 실패. 백엔드의 {code, message, details}를 그대로 담는다.
 * status 0은 서버에 닿지 못한 경우(네트워크 오류)다.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, body: ErrorResponse) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details ?? {}
  }

  /** 4xx: 같은 요청을 다시 보내도 결과가 같다. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }
}

export const API_BASE = '/api'

type Json = Record<string, unknown> | unknown[]

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** 객체면 JSON으로 보내고, FormData면 그대로 보낸다 (multipart 업로드). */
  body?: Json | FormData
}

/** 쓰기 요청에는 CSRF 토큰을 붙인다 (서버가 XSRF-TOKEN 쿠키로 내려준 값을 X-XSRF-TOKEN 헤더로). */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
export const CSRF_COOKIE = 'XSRF-TOKEN'
export const CSRF_HEADER = 'X-XSRF-TOKEN'

export function readCookie(name: string): string | null {
  const prefix = `${name}=`
  const found = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return found ? decodeURIComponent(found.slice(prefix.length)) : null
}

/**
 * API를 호출한다. 쓰기 요청이 CSRF 토큰 문제(403 CSRF_TOKEN_INVALID)로 거절되면
 * 토큰 쿠키를 다시 받아 한 번만 재시도한다 (로그아웃 직후처럼 쿠키가 지워진 경우).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await request<T>(path, options)
  } catch (error) {
    const method = (options.method ?? 'GET').toUpperCase()
    if (error instanceof ApiError && error.code === 'CSRF_TOKEN_INVALID' && UNSAFE_METHODS.has(method)) {
      await refreshCsrfToken()
      return request<T>(path, options)
    }
    throw error
  }
}

/** 로그인 여부와 상관없이 응답에 XSRF-TOKEN 쿠키가 실리는 API를 불러 토큰을 새로 받는다. */
async function refreshCsrfToken(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/me`, { headers: { Accept: 'application/json' } })
  } catch {
    // 네트워크 오류면 재시도 요청에서 같은 오류가 다시 난다
  }
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { body, headers, ...rest } = options
  const isForm = body instanceof FormData
  const method = (rest.method ?? 'GET').toUpperCase()
  const csrfToken = UNSAFE_METHODS.has(method) ? readCookie(CSRF_COOKIE) : null

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, {
      code: CLIENT_ERROR_CODES.NETWORK_ERROR,
      message: '서버에 연결할 수 없습니다.',
      details: {},
    })
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response))
  }
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T
  }
  return (await response.json()) as T
}

async function readError(response: Response): Promise<ErrorResponse> {
  try {
    const body = (await response.json()) as Partial<ErrorResponse>
    if (typeof body.code === 'string' && typeof body.message === 'string') {
      return { code: body.code, message: body.message, details: body.details ?? {} }
    }
  } catch {
    // JSON이 아닌 응답 (프록시의 502 HTML 등)
  }
  return {
    code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
    message: `요청을 처리하지 못했습니다. (HTTP ${response.status})`,
    details: {},
  }
}
