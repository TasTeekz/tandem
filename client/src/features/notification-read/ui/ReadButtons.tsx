import { useTranslation } from 'react-i18next'
import { useMarkAllRead, useMarkRead } from '@/entities/notification'
import { errorMessage } from '@/shared/api'
import { Button, IconButton, useToast } from '@/shared/ui'

export function MarkReadButton({ id }: { id: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const mark = useMarkRead()
  return <IconButton icon="check" size="sm" label={t('notifications.markRead')} disabled={mark.isPending} onClick={() => mark.mutate(id, { onError: (e) => toast(errorMessage(e), 'error') })} />
}

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation()
  const toast = useToast()
  const markAll = useMarkAllRead()
  return (
    <Button variant="secondary" icon="check" loading={markAll.isPending} disabled={disabled} onClick={() => markAll.mutate(undefined, { onError: (e) => toast(errorMessage(e), 'error') })}>
      {t('notifications.markAll')}
    </Button>
  )
}
