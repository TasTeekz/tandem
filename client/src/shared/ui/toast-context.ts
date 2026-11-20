import { createContext, useContext } from 'react'

export type Push = (message: string, kind?: 'info' | 'success' | 'error') => void
export const ToastContext = createContext<Push | null>(null)

export function useToast(): Push {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
