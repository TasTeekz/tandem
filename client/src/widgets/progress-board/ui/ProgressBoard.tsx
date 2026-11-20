import { useTranslation } from 'react-i18next'
import { useProgressBoard } from '@/entities/goal'
import { errorMessage } from '@/shared/api'
import { Avatar, Button, Card, EmptyState, ProgressBar, ProgressRing, Skeleton } from '@/shared/ui'
import './progress-board.css'

export function ProgressBoard({ groupId, meId }: { groupId: string; meId: string }) {
  const { t } = useTranslation()
  const { data, isPending, isError, error, refetch } = useProgressBoard(groupId)

  return (
    <section className="stack" aria-label={t('progress.heading')}>
      <h2>{t('progress.heading')}</h2>
      {isPending ? (
        <div className="pboard" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} height={150} />)}</div>
      ) : isError ? (
        <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      ) : data.goals.length === 0 ? (
        <EmptyState icon="target" title={t('progress.emptyTitle')} text={t('progress.emptyText')} />
      ) : (
        <ul className="pboard">
          {[...data.members].sort((a, b) => b.overall_percent - a.overall_percent).map((m) => (
            <li key={m.user_id}>
              <Card className="pcard">
                <div className="pcard__head">
                  <ProgressRing value={m.overall_percent} size={64} label={t('progress.overall', { name: m.full_name })} />
                  <div className="pcard__who">
                    <Avatar name={m.full_name} size={28} />
                    <span className="pcard__name">{m.full_name}{m.user_id === meId && <span className="pcard__me"> {t('members.you')}</span>}</span>
                  </div>
                </div>
                <ul className="pcard__goals">
                  {data.goals.map((g) => (
                    <li key={g.goal_id}>
                      <span className="pcard__goal">{g.title}</span>
                      <ProgressBar value={m.per_goal.find((p) => p.goal_id === g.goal_id)?.percent ?? 0} label={`${m.full_name}: ${g.title}`} />
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
