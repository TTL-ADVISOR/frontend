import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastTone } from './context'

const TOAST_MS = 5000
const MAX_TOASTS = 3

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

/** 알림을 모아 보여 준다. 알림은 5초 뒤 사라지고, 닫기로 먼저 닫을 수 있다 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++
      setToasts((list) => [...list, { id, message, tone }].slice(-MAX_TOASTS))
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), TOAST_MS),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="region" aria-label="알림">
        <div aria-live="polite" className="toasts__list">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast--${toast.tone}`}>
              <p className="toast__message">{toast.message}</p>
              <button type="button" className="toast__close" aria-label="알림 닫기" onClick={() => dismiss(toast.id)}>
                닫기
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
