import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { COMPANY_MAX, EMAIL_MAX, PASSWORD_MAX, USER_NAME_MAX } from '../api/auth'
import { ApiError } from '../api/client'
import FormField from '../features/auth/FormField'
import { useMe, useSignup } from '../features/auth/queries'
import { safeNextPath, validateSignup, type SignupErrors, type SignupValues } from '../features/auth/validation'

const EMPTY: SignupValues = { name: '', email: '', password: '', passwordConfirm: '', company: '' }
const FIELDS = ['name', 'email', 'password', 'passwordConfirm', 'company'] as const

export default function SignupPage() {
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const me = useMe()
  const mutation = useSignup()
  const [values, setValues] = useState<SignupValues>(EMPTY)
  const [errors, setErrors] = useState<SignupErrors>({})

  if (me.data) return <Navigate to={next} replace />

  const serverErrors = mutation.error ? serverFieldErrors(mutation.error) : {}
  const fieldError = (field: keyof SignupValues) => errors[field] ?? serverErrors[field]
  const hasFieldError = FIELDS.some((f) => serverErrors[f])
  const formError = mutation.error && !hasFieldError ? errorMessage(mutation.error) : null

  function update(field: keyof SignupValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateSignup(values)
    setErrors(found)
    if (Object.values(found).some(Boolean)) return
    mutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      company: values.company.trim() || null,
    })
  }

  return (
    <section className="auth">
      <h1 className="auth__title">회원가입</h1>
      <p className="auth__subtitle">접근 로그를 올리면 API마다 알맞은 TTL을 근거와 함께 추천해 드려요.</p>
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p role="alert" className="notice notice--error auth__notice">
            {formError}
          </p>
        )}
        <FormField
          id="signup-name"
          label="이름"
          autoComplete="name"
          maxLength={USER_NAME_MAX}
          value={values.name}
          error={fieldError('name')}
          onChange={(e) => update('name', e.target.value)}
        />
        <FormField
          id="signup-email"
          label="이메일"
          type="email"
          autoComplete="email"
          maxLength={EMAIL_MAX}
          value={values.email}
          error={fieldError('email')}
          onChange={(e) => update('email', e.target.value)}
        />
        <FormField
          id="signup-password"
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          hint="8~64자"
          value={values.password}
          error={fieldError('password')}
          onChange={(e) => update('password', e.target.value)}
        />
        <FormField
          id="signup-password-confirm"
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          value={values.passwordConfirm}
          error={fieldError('passwordConfirm')}
          onChange={(e) => update('passwordConfirm', e.target.value)}
        />
        <FormField
          id="signup-company"
          label={
            <>
              회사 <span className="muted">(선택)</span>
            </>
          }
          autoComplete="organization"
          maxLength={COMPANY_MAX}
          value={values.company}
          error={fieldError('company')}
          onChange={(e) => update('company', e.target.value)}
        />
        <button type="submit" className="button button--primary auth__submit" disabled={mutation.isPending}>
          {mutation.isPending ? '가입하는 중…' : '가입하기'}
        </button>
      </form>
      <p className="auth__switch muted">
        이미 계정이 있으신가요? <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>로그인</Link>
      </p>
    </section>
  )
}

/** 서버 검증 오류(details)와 이메일 중복(409)을 필드 오류로 바꾼다. */
function serverFieldErrors(error: Error): SignupErrors {
  if (!(error instanceof ApiError)) return {}
  if (error.code === 'EMAIL_ALREADY_EXISTS') return { email: error.message }
  const result: SignupErrors = {}
  for (const field of FIELDS) {
    const reason = error.details[field]
    if (typeof reason === 'string') result[field] = reason
  }
  return result
}

function errorMessage(error: Error): string {
  return error instanceof ApiError ? error.message : '가입하지 못했습니다.'
}
