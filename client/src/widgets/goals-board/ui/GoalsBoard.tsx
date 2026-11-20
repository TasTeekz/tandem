import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoalCard, useDeleteGoal, useGoals } from '@/entities/goal'
import type { Goal } from '@/entities/goal'
import { GoalFormModal } from '@/features/goal-edit'
import { ProgressSlider } from '@/features/progress-set'
import { errorMessage } from '@/shared/api'
import { Button, ConfirmDialog, EmptyState, IconButton, Skeleton, useToast } from '@/shared/ui'

type Props = { groupId: string; canManage: boolean }

export function GoalsBoard({ groupId, canManage }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { data, isPending, isError, error, refetch } = useGoals(groupId)
  const remove = useDeleteGoal(groupId)
  const [form, setForm] = useState<{ goal?: Goal } | null>(null)
  const [target, setTarget] = useState<Goal | null>(null)

  const confirmDelete = () => {
    if (!target) return
    remove.mutate(target.id, {
      onSuccess: () => toast(t('goals.deleted'), 'success'),
      onError: (e) => toast(errorMessage(e), 'error'),
      onSettled: () => setTarget(null),
    })
  }

  return (
    <section className="stack" aria-label={t('goals.heading')}>
      <div className="section-head">
        <h2>{t('goals.heading')}</h2>
        {canManage && <Button icon="plus" size="sm" onClick={() => setForm({})}>{t('goals.add')}</Button>}
      </div>
      {isPending ? (
        <div className="stack-sm" aria-busy="true">{[0, 1].map((i) => <Skeleton key={i} height={120} />)}</div>
      ) : isError ? (
        <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="target" title={t('goals.emptyTitle')} text={t(canManage ? 'goals.emptyMentor' : 'goals.emptyText')} action={canManage ? <Button icon="plus" onClick={() => setForm({})}>{t('goals.add')}</Button> : undefined} />
      ) : (
        <ul className="list">
          {data.items.map((g) => (
            <GoalCard key={g.id} goal={g} actions={canManage && <span className="row-actions">
              <IconButton icon="edit" size="sm" label={t('common.edit')} onClick={() => setForm({ goal: g })} />
              <IconButton icon="trash" size="sm" label={t('common.delete')} onClick={() => setTarget(g)} />
            </span>}>
              <ProgressSlider groupId={groupId} goal={g} />
            </GoalCard>
          ))}
        </ul>
      )}
      <GoalFormModal open={!!form} onClose={() => setForm(null)} groupId={groupId} goal={form?.goal} />
      <ConfirmDialog open={!!target} title={t('goals.deleteTitle')} text={t('goals.deleteConfirm', { title: target?.title ?? '' })} loading={remove.isPending} onConfirm={confirmDelete} onClose={() => setTarget(null)} />
    </section>
  )
}
