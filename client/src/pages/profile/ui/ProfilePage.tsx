import { useTranslation } from 'react-i18next'
import { useSession } from '@/entities/user'
import { ProfileForm } from '@/features/profile-edit'
import { formatDate } from '@/shared/lib'
import { Avatar, Badge, Card, PageHeader, Skeleton } from '@/shared/ui'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user } = useSession()
  return (
    <div className="page page--narrow">
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      {!user ? <Skeleton height={320} /> : (
        <Card className="stack">
          <div className="profile-head">
            <Avatar name={user.full_name} size={56} />
            <div>
              <strong>{user.full_name}</strong>
              <p className="muted">{t('profile.memberSince', { date: formatDate(user.created_at, i18n.language) })}</p>
            </div>
            <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{t(`roles.${user.role}`)}</Badge>
          </div>
          <ProfileForm key={user.id} user={user} />
        </Card>
      )}
    </div>
  )
}
