import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { GroupCard, useGroups, useMyGroups } from '@/entities/group'
import { GroupFormModal } from '@/features/group-create'
import { JoinButton } from '@/features/group-join-leave'
import { errorMessage } from '@/shared/api'
import { useDebounced } from '@/shared/lib'
import { Button, EmptyState, Icon, Input, PageHeader, Pagination, Skeleton } from '@/shared/ui'

const PAGE_SIZE = 12

function CardGridSkeleton() {
  return <div className="grid-cards" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} height={170} />)}</div>
}

export function GroupsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const mine = useMyGroups()
  const discover = useGroups({ q: useDebounced(q.trim()), page, pageSize: PAGE_SIZE })
  const pages = Math.max(1, Math.ceil((discover.data?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="page">
      <PageHeader title={t('groups.title')} subtitle={t('groups.subtitle')} actions={<Button icon="plus" onClick={() => setCreating(true)}>{t('group.create')}</Button>} />

      <section className="stack" aria-labelledby="my-groups">
        <h2 id="my-groups">{t('groups.mine')}</h2>
        {mine.isPending ? <CardGridSkeleton /> : mine.isError ? (
          <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(mine.error)} action={<Button variant="secondary" onClick={() => void mine.refetch()}>{t('common.retry')}</Button>} />
        ) : mine.data.items.length === 0 ? (
          <EmptyState icon="users" title={t('groups.mineEmptyTitle')} text={t('groups.mineEmptyText')} action={<Button icon="plus" onClick={() => setCreating(true)}>{t('group.create')}</Button>} />
        ) : (
          <ul className="grid-cards">{mine.data.items.map((g) => <li key={g.id}><GroupCard group={g} /></li>)}</ul>
        )}
      </section>

      <section className="stack" aria-labelledby="discover">
        <div className="section-head">
          <h2 id="discover">{t('groups.discover')}</h2>
          <div className="section-head__search">
            <Input label={t('groups.filter')} type="search" value={q} leading={<Icon name="search" size={18} />} placeholder={t('groups.filterPlaceholder')} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        </div>
        {discover.isPending ? <CardGridSkeleton /> : discover.isError ? (
          <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(discover.error)} action={<Button variant="secondary" onClick={() => void discover.refetch()}>{t('common.retry')}</Button>} />
        ) : discover.data.items.length === 0 ? (
          <EmptyState icon="search" title={t('groups.discoverEmptyTitle')} text={t('groups.discoverEmptyText')} />
        ) : (
          <>
            <ul className="grid-cards">
              {discover.data.items.map((g) => <li key={g.id}><GroupCard group={g} actions={!g.my_role && <JoinButton groupId={g.id} />} /></li>)}
            </ul>
            {pages > 1 && <div className="center"><Pagination page={page} total={pages} onChange={setPage} /></div>}
          </>
        )}
      </section>

      <GroupFormModal open={creating} onClose={() => setCreating(false)} onSaved={(g) => navigate(`/groups/${g.id}`)} />
    </div>
  )
}
