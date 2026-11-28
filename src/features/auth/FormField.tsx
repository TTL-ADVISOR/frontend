import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import Icon from '../../components/Icon'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: ReactNode
  error?: string
  hint?: string
}

/**
 * 라벨·입력·안내·오류를 묶는다. 안내와 오류는 aria-describedby로 입력에 연결한다.
 * 비밀번호 칸에는 입력한 값을 보고 숨기는 버튼을 붙인다.
 */
export default function FormField({ id, label, error, hint, type, ...input }: Props) {
  const [revealed, setRevealed] = useState(false)
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const isPassword = type === 'password'
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <div className={isPassword ? 'field__control field__control--password' : 'field__control'}>
        <input
          id={id}
          className="input"
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            className="field__reveal"
            aria-label="비밀번호 보기"
            aria-pressed={revealed}
            aria-controls={id}
            title={revealed ? '비밀번호 숨기기' : '비밀번호 보기'}
            onClick={() => setRevealed((value) => !value)}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} />
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
