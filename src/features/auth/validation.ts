import {
  COMPANY_MAX,
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN,
  USER_NAME_MAX,
} from '../../api/auth'

export interface SignupValues {
  name: string
  email: string
  password: string
  passwordConfirm: string
  company: string
}

export type SignupErrors = Partial<Record<keyof SignupValues, string>>

// 서버(@Email)보다 느슨하게, 흔한 실수(@ 빠짐, 도메인 없음)만 먼저 잡는다. 최종 판단은 서버가 한다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 서버와 같은 규칙으로 먼저 검사한다 (API.md 0-1). 비밀번호 확인은 화면에서만 검사한다. */
export function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {}
  const name = values.name.trim()
  if (!name) errors.name = '이름을 입력해 주세요.'
  else if (name.length > USER_NAME_MAX) errors.name = `이름은 ${USER_NAME_MAX}자 이하여야 합니다.`

  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError

  const { password } = values
  if (!password.trim()) errors.password = '비밀번호를 입력해 주세요.'
  else if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX)
    errors.password = `비밀번호는 ${PASSWORD_MIN}~${PASSWORD_MAX}자여야 합니다.`
  else if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES)
    errors.password = '비밀번호가 너무 깁니다. 한글은 24자, 영문·숫자는 64자까지 쓸 수 있습니다.'

  if (!errors.password && values.passwordConfirm !== password)
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'

  if (values.company.trim().length > COMPANY_MAX) errors.company = `회사는 ${COMPANY_MAX}자 이하여야 합니다.`
  return errors
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim()
  if (!email) return '이메일을 입력해 주세요.'
  if (email.length > EMAIL_MAX) return `이메일은 ${EMAIL_MAX}자 이하여야 합니다.`
  if (!EMAIL_PATTERN.test(email)) return '이메일 형식이 올바르지 않습니다.'
  return undefined
}

/**
 * 로그인 후 돌아갈 경로. 다른 사이트로 보내는 주소(//evil.com, https://...)는 받지 않는다 (오픈 리다이렉트 방지).
 */
export function safeNextPath(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) return next
  return '/projects'
}
