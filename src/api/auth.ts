import { ApiError, apiFetch } from './client'

/** 0-1, 0-2, 0-4 사용자 응답 */
export interface User {
  id: number
  name: string
  email: string
  company: string | null
  createdAt: string
}

export interface SignupInput {
  name: string
  email: string
  password: string
  company: string | null
}

export const USER_NAME_MAX = 50
export const EMAIL_MAX = 255
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64
/** BCrypt는 앞 72바이트만 쓴다. 서버도 넘으면 400으로 거절한다. */
export const PASSWORD_MAX_BYTES = 72
export const COMPANY_MAX = 100

/** 로그인 상태면 사용자, 아니면 null. 이 호출이 XSRF-TOKEN 쿠키도 받아 온다. */
export async function fetchMe(): Promise<User | null> {
  try {
    return await apiFetch<User>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function signup(input: SignupInput): Promise<User> {
  return apiFetch('/auth/signup', { method: 'POST', body: { ...input } })
}

export function login(email: string, password: string): Promise<User> {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } })
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' })
}
