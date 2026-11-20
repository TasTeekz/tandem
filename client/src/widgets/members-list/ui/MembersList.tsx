import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MemberRow, useMembers, useRemoveMember, useSetMemberRole } from '@/entities/member'
import type { Member } from '@/entities/member'
import { errorMessage } from '@/shared/api'
import { Button, ConfirmDialog, EmptyState, Menu, Icon, Skeleton, useToast } from '@/shared/ui'

type Props = { groupId: string; meId: string; canManage: boolean }

export function MembersList({ groupId, meId, canManage }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { data, isPending, isError, error, refetch } = useMembers(groupId)
  const setRole = useSetMemberRole(groupId)
  const remove = useRemoveMember(groupId)
  const [target, setTarget] = useState<Member | null>(null)
  const fail = (e: unknown) => toast(errorMessage(e), 'error')

  const confirmRemove = () => {
    if (!target) return
    remove.mutate(target.user_id, { onSuccess: () => toast(t('members.removed'), 'success'), onError: fail, onSettled: () => setTarget(null) })
  }

  if (isPending) return <div className="stack-sm" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} height={64} />)}</div>
  if (isError) return <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />

  return (
    <>
      <ul className="list" aria-label={t('group.tabs.members')}>
        {data.items.map((m) => (
          <MemberRow key={m.user_id} member={m} isMe={m.user_id === meId} actions={canManage && m.user_id !== meId && (
            <Menu
              align="end" label={t('members.actions', { name: m.full_name })}
              trigger={<span className="t-btn t-btn--ghost t-btn--icon t-btn--sm" aria-hidden="true"><Icon name="more" size={16} /></span>}
              items={[
                m.role === 'member'
                  ? { id: 'promote', label: t('members.makeMentor'), icon: 'user' as const, onSelect: () => setRole.mutate({ userId: m.user_id, role: 'mentor' }, { onSuccess: () => toast(t('members.updated'), 'success'), onError: fail }) }
                  : { id: 'demote', label: t('members.makeMember'), icon: 'user' as const, onSelect: () => setRole.mutate({ userId: m.user_id, role: 'member' }, { onSuccess: () => toast(t('members.updated'), 'success'), onError: fail }) },
                { id: 'remove', label: t('members.remove'), icon: 'trash' as const, danger: true, onSelect: () => setTarget(m) },
              ]}
            />
          )} />
        ))}
      </ul>
      <ConfirmDialog open={!!target} title={t('members.removeTitle')} text={t('members.removeConfirm', { name: target?.full_name ?? '' })} confirmLabel={t('members.remove')} loading={remove.isPending} onConfirm={confirmRemove} onClose={() => setTarget(null)} />
    </>
  )
}
