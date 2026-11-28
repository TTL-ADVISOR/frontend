import { useEffect, useRef, useState } from 'react'

/** 코드 블록과 복사 버튼. 복사하면 잠깐 "복사됨"으로 바뀐다. */
export default function CodeBlock({ code, label }: { code: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setState('copied')
    } catch {
      setState('failed')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  return (
    <div className="code-block">
      <pre className="code-block__pre" aria-label={label} tabIndex={0}>
        <code>{code}</code>
      </pre>
      <button type="button" className="code-block__copy" onClick={copy} aria-label={`${label} 복사`}>
        {state === 'copied' ? '복사됨' : state === 'failed' ? '복사 실패' : '복사'}
      </button>
      <span className="sr-only" role="status">
        {state === 'copied' ? '복사했어요' : state === 'failed' ? '복사하지 못했어요' : ''}
      </span>
    </div>
  )
}
