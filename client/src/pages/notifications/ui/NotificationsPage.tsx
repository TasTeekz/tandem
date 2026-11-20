import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { NotificationItem, useNotifications } from '@/entities/notification'
import { MarkAllReadButton, MarkReadButton } from '@/features/notification-read'
import { errorMessage } from '@/shared/api'
import { Button, EmptyState, PageHeader, Pagination, Skeleton } from '@/shared/ui'

const PAGE_SIZE = 20

export function NotificationsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, isPending, isError, error, refetch } = useNotifications(page, PAGE_SIZE)
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))
  const hasUnread = !!data?.items.some((n) => !n.is_read)

  return (
    <div className="page page--medium">
      <PageHeader title={t('notifications.title')} subtitle={t('notifications.subtitle')} actions={<MarkAllReadButton disabled={!hasUnread} />} />
      {isPending ? (
        <div className="stack-sm" aria-busy="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} />)}</div>
      ) : isError ? (
        <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="bell" title={t('notifications.emptyTitle')} text={t('notifications.emptyText')} />
      ) : (
        <>
          <ul className="list">
            {data.items.map((n) => (
              <NotificationItem key={n.id} notification={n} actions={
                <span className="row-actions">
                  {n.group_id && <Link className="t-btn t-btn--ghost t-btn--sm" to={`/groups/${n.group_id}`}>{t('notifications.open')}</Link>}
                  {!n.is_read && <MarkReadButton id={n.id} />}
                </span>
              } />
            ))}
          </ul>
          {pages > 1 && <div className="center"><Pagination page={page} total={pages} onChange={setPage} /></div>}
        </>
      )}
    </div>
  )
}
