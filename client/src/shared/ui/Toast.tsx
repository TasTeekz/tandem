import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from './Button'
import { Icon } from './icons'
import { ToastContext } from './toast-context'
import type { Push } from './toast-context'

type ToastKind = 'info' | 'success' | 'error'
type ToastItem = { id: number; kind: ToastKind; message: string }
let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const { t } = useTranslation()
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const push = useCallback<Push>((message, kind = 'info') => {
    const id = ++seq
    setItems((xs) => [...xs.slice(-3), { id, kind, message }])
    setTimeout(() => dismiss(id), 5000)
  }, [dismiss])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="t-toasts" role="region" aria-live="polite" aria-label="Notifications">
        {items.map((x) => (
          <div key={x.id} className={`t-toast t-toast--${x.kind}`} role={x.kind === 'error' ? 'alert' : 'status'}>
            <Icon name={x.kind === 'success' ? 'check' : x.kind === 'error' ? 'alert' : 'info'} size={18} />
            <span className="t-toast__msg">{x.message}</span>
            <IconButton icon="x" size="sm" label={t('common.close')} onClick={() => dismiss(x.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
