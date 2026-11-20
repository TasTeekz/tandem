import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { GroupCard } from '@/entities/group'
import { MaterialRow } from '@/entities/material'
import { SearchBox, useSearch } from '@/features/search-query'
import { errorMessage } from '@/shared/api'
import { useDebounced } from '@/shared/lib'
import { Avatar, Button, EmptyState, Icon, PageHeader, Skeleton } from '@/shared/ui'
import './search.css'

export function SearchPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(params.get('q') ?? '')
  const q = useDebounced(text.trim())
  const { data, isFetching, isError, error, refetch } = useSearch(q)

  useEffect(() => { setParams(q ? { q } : {}, { replace: true }) }, [q, setParams])

  const total = data ? data.groups.length + data.materials.length + data.users.length : 0
  return (
    <div className="page">
      <PageHeader title={t('search.title')} subtitle={t('search.subtitle')} />
      <SearchBox value={text} onChange={setText} />
      <div className="search-results" aria-live="polite" aria-busy={isFetching}>
        {!q ? (
          <EmptyState icon="search" title={t('search.startTitle')} text={t('search.startText')} />
        ) : isError ? (
          <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
        ) : !data ? (
          <div className="stack-sm">{[0, 1, 2].map((i) => <Skeleton key={i} height={72} />)}</div>
        ) : total === 0 ? (
          <EmptyState icon="search" title={t('search.noResultsTitle')} text={t('search.noResultsText', { q })} />
        ) : (
          <>
            {data.groups.length > 0 && (
              <section className="stack" aria-labelledby="sr-groups">
                <h2 id="sr-groups">{t('search.groups')} <span className="count t-num">{data.groups.length}</span></h2>
                <ul className="grid-cards">{data.groups.map((g) => <li key={g.id}><GroupCard group={g} /></li>)}</ul>
              </section>
            )}
            {data.materials.length > 0 && (
              <section className="stack" aria-labelledby="sr-materials">
                <h2 id="sr-materials">{t('search.materials')} <span className="count t-num">{data.materials.length}</span></h2>
                <ul className="list">
                  {data.materials.map((m) => (
                    <MaterialRow key={m.id} material={m} actions={<Link className="t-btn t-btn--ghost t-btn--sm" to={`/groups/${m.group_id}?tab=materials`}>{t('search.openGroup')}</Link>} />
                  ))}
                </ul>
              </section>
            )}
            {data.users.length > 0 && (
              <section className="stack" aria-labelledby="sr-users">
                <h2 id="sr-users">{t('search.users')} <span className="count t-num">{data.users.length}</span></h2>
                <ul className="grid-cards grid-cards--small">
                  {data.users.map((u) => <li key={u.id} className="search-user"><Avatar name={u.full_name} size={40} /><span>{u.full_name}</span><Icon name="user" size={16} /></li>)}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
