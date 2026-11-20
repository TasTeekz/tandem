import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import type { Page } from '@/shared/api'
import { Button, EmptyState, Icon, Input, Pagination, Skeleton, Table } from '@/shared/ui'
import type { Column } from '@/shared/ui'
import { ADMIN_PAGE_SIZE } from '@/features/admin-crud'
import './admin-section.css'

type Props<T> = {
  caption: string
  columns: Column<T>[]
  rowKey: (row: T) => string
  data: Page<T> | undefined
  isPending: boolean
  error: unknown
  onRetry: () => void
  q: string
  onQuery: (q: string) => void
  page: number
  onPage: (page: number) => void
  onCreate: () => void
  createLabel: string
}

/** Presentational shell shared by the users, groups and materials tabs: search, table, pager, states. */
export function AdminSection<T>({ caption, columns, rowKey, data, isPending, error, onRetry, q, onQuery, page, onPage, onCreate, createLabel }: Props<T>) {
  const { t } = useTranslation()
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / ADMIN_PAGE_SIZE))
  return (
    <section className="stack" aria-label={caption}>
      <div className="admin-bar">
        <Input label={t('common.search')} type="search" value={q} leading={<Icon name="search" size={18} />} placeholder={t('admin.searchPlaceholder')} onChange={(e) => onQuery(e.target.value)} />
        <Button icon="plus" onClick={onCreate}>{createLabel}</Button>
      </div>
      {isPending ? (
        <div className="stack-sm" aria-busy="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} />)}</div>
      ) : error ? (
        <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={onRetry}>{t('common.retry')}</Button>} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon="search" title={t('admin.emptyTitle')} text={t('admin.emptyText')} />
      ) : (
        <>
          <Table caption={caption} columns={columns} rows={data.items} rowKey={rowKey} />
          <div className="admin-foot">
            <span className="admin-total t-num">{t('admin.total', { n: data.total })}</span>
            {pages > 1 && <Pagination page={page} total={pages} onChange={onPage} />}
          </div>
        </>
      )}
    </section>
  )
}
