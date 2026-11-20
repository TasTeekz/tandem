import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from './Button'

type ModalProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }

/** Native <dialog>: focus trap, Esc and inert background come from the platform. */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { t } = useTranslation()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      if (d.showModal) d.showModal()
      else d.setAttribute('open', '')
    }
    if (!open && d.open) {
      if (d.close) d.close()
      else d.removeAttribute('open')
    }
  }, [open])
  return (
    <dialog ref={ref} className="t-modal" aria-labelledby={titleId} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="t-modal__panel">
        <header className="t-modal__head">
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="x" label={t('common.close')} onClick={onClose} size="sm" />
        </header>
        <div className="t-modal__body">{children}</div>
        {footer && <footer className="t-modal__foot">{footer}</footer>}
      </div>
    </dialog>
  )
}
