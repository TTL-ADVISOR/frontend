import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'warning' | 'error'

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void
}

export const ToastContext = createContext<ToastApi>({ show: () => {} })

/** 화면 오른쪽 아래에 잠깐 알림을 띄운다. ToastProvider 밖에서는 아무 일도 하지 않는다 */
export function useToast() {
  return useContext(ToastContext)
}
