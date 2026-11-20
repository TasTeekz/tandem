import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/entities/user'
import { useAdminStats } from '@/features/admin-crud'
import { errorMessage } from '@/shared/api'
import { Card, EmptyState, PageHeader, Skeleton, Tabs } from '@/shared/ui'
import { AdminGroupsTable, AdminMaterialsTable, AdminUsersTable } from '@/widgets/admin-table'
import './admin.css'

const STATS = ['users', 'active_users', 'groups', 'materials', 'messages', 'goals'] as const

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const stats = useAdminStats()
  const [tab, setTab] = useState('users')

  return (
    <div className="page">
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />
      {stats.isError ? (
        <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(stats.error)} />
      ) : (
        <ul className="stats" aria-label={t('admin.stats')}>
          {STATS.map((k) => (
            <li key={k}>
              <Card className="stat">
                {stats.data ? <strong className="stat__n t-num">{stats.data[k]}</strong> : <Skeleton width={56} height={32} />}
                <span className="stat__l">{t(`admin.stat.${k}`)}</span>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Tabs label={t('admin.title')} value={tab} onChange={setTab}
        items={[
          { id: 'users', label: t('admin.tabs.users'), content: user && <AdminUsersTable meId={user.id} /> },
          { id: 'groups', label: t('admin.tabs.groups'), content: <AdminGroupsTable /> },
          { id: 'materials', label: t('admin.tabs.materials'), content: <AdminMaterialsTable /> },
        ]} />
    </div>
  )
}
