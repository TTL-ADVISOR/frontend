import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import FormField from '../features/auth/FormField'
import { useLogin, useMe } from '../features/auth/queries'
import { safeNextPath, validateEmail } from '../features/auth/validation'

/** 소셜 로그인(B18)이 실패해 돌아왔을 때 붙는 ?error= 코드 (API.md 0-5). */
const OAUTH_ERRORS: Record<string, string> = {
  EMAIL_ALREADY_REGISTERED: '이미 이메일로 가입된 계정입니다. 이메일과 비밀번호로 로그인해 주세요.',
  OAUTH_EMAIL_UNVERIFIED: '인증된 이메일을 받지 못했습니다. 계정의 이메일 인증을 확인해 주세요.',
  OAUTH_FAILED: '소셜 로그인에 실패했습니다. 다시 시도해 주세요.',
}

export default function LoginPage() {
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const me = useMe()
  const mutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  if (me.data) return <Navigate to={next} replace />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = { email: validateEmail(email), password: password ? undefined : '비밀번호를 입력해 주세요.' }
    setErrors(found)
    if (found.email || found.password) return
    mutation.mutate({ email: email.trim(), password })
  }

  const oauthError = params.get('error')
  const formError = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : '로그인하지 못했습니다.'
    : oauthError
      ? (OAUTH_ERRORS[oauthError] ?? OAUTH_ERRORS.OAUTH_FAILED)
      : null

  return (
    <section className="auth">
      <h1 className="auth__title">로그인</h1>
      <form className="card auth__form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p role="alert" className="notice notice--error auth__notice">
            {formError}
          </p>
        )}
        <FormField
          id="login-email"
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          id="login-password"
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="button button--primary auth__submit" disabled={mutation.isPending}>
          {mutation.isPending ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <p className="auth__switch muted">
        계정이 없으신가요? <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>회원가입</Link>
      </p>
    </section>
  )
}
