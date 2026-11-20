import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmProps = { open: boolean; title: string; text: string; confirmLabel?: string; loading?: boolean; onConfirm: () => void; onClose: () => void }

export function ConfirmDialog({ open, title, text, confirmLabel, loading, onConfirm, onClose }: ConfirmProps) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
      <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel ?? t('common.delete')}</Button>
    </>}>
      <p>{text}</p>
    </Modal>
  )
}
