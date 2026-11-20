import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJoinGroup, useLeaveGroup } from '@/entities/group'
import { errorMessage } from '@/shared/api'
import { Button, ConfirmDialog, useToast } from '@/shared/ui'

export function JoinButton({ groupId, size = 'sm' }: { groupId: string; size?: 'sm' | 'md' }) {
  const { t } = useTranslation()
  const toast = useToast()
  const join = useJoinGroup()
  return (
    <Button size={size} icon="plus" loading={join.isPending}
      onClick={() => join.mutate(groupId, { onSuccess: () => toast(t('group.joined'), 'success'), onError: (e) => toast(errorMessage(e), 'error') })}>
      {t('group.join')}
    </Button>
  )
}

export function LeaveButton({ groupId, onLeft }: { groupId: string; onLeft?: () => void }) {
  const { t } = useTranslation()
  const toast = useToast()
  const leave = useLeaveGroup()
  const [asking, setAsking] = useState(false)
  const confirm = () =>
    leave.mutate(groupId, {
      onSuccess: () => { toast(t('group.left'), 'success'); setAsking(false); onLeft?.() },
      onError: (e) => { toast(errorMessage(e), 'error'); setAsking(false) },
    })
  return (
    <>
      <Button variant="secondary" icon="logout" onClick={() => setAsking(true)}>{t('group.leave')}</Button>
      <ConfirmDialog open={asking} title={t('group.leave')} text={t('group.leaveConfirm')} confirmLabel={t('group.leave')} loading={leave.isPending} onConfirm={confirm} onClose={() => setAsking(false)} />
    </>
  )
}
