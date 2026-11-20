import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { GroupCard, useGroups } from '@/entities/group'
import { useSession } from '@/entities/user'
import { errorMessage } from '@/shared/api'
import { Button, EmptyState, Icon, Skeleton } from '@/shared/ui'
import './home.css'

const perks = [
  { icon: 'chat', key: 'chat' },
  { icon: 'file', key: 'materials' },
  { icon: 'target', key: 'goals' },
] as const

export function HomePage() {
  const { t } = useTranslation()
  const { status } = useSession()
  const groups = useGroups({ page: 1, pageSize: 6 })
  if (status === 'authed') return <Navigate to="/groups" replace />

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('app.tagline')}</h1>
          <p className="hero__lead">{t('home.lead')}</p>
          <div className="hero__cta">
            <Link to="/register" className="t-btn t-btn--primary t-btn--lg">{t('home.cta')}</Link>
            <Link to="/login" className="t-btn t-btn--secondary t-btn--lg">{t('auth.login')}</Link>
          </div>
        </div>
        <ul className="hero__perks">
          {perks.map((p) => (
            <li key={p.key}>
              <span className="hero__perk-icon"><Icon name={p.icon} size={22} /></span>
              <div><strong>{t(`home.perks.${p.key}.title`)}</strong><p>{t(`home.perks.${p.key}.text`)}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack" aria-labelledby="public-groups">
        <div className="section-head"><h2 id="public-groups">{t('home.publicGroups')}</h2></div>
        {groups.isPending ? (
          <div className="grid-cards" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} height={170} />)}</div>
        ) : groups.isError ? (
          <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(groups.error)} action={<Button variant="secondary" onClick={() => void groups.refetch()}>{t('common.retry')}</Button>} />
        ) : groups.data.items.length === 0 ? (
          <EmptyState icon="users" title={t('groups.discoverEmptyTitle')} text={t('groups.discoverEmptyText')} />
        ) : (
          <ul className="grid-cards">{groups.data.items.map((g) => <li key={g.id}><GroupCard group={g} /></li>)}</ul>
        )}
      </section>
    </div>
  )
}
