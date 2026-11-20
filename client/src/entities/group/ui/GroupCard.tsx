import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge, Card, Icon } from '@/shared/ui'
import type { Group } from '../api/group'
import './group-card.css'

export function GroupCard({ group, actions }: { group: Group; actions?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Card interactive className="group-card">
      <div className="group-card__top">
        {group.subject ? <Badge tone="accent">{group.subject}</Badge> : <span />}
        <Badge tone={group.is_public ? 'neutral' : 'primary'}>{group.is_public ? t('group.public') : t('group.private')}</Badge>
      </div>
      <h3 className="group-card__title"><Link to={`/groups/${group.id}`}>{group.title}</Link></h3>
      <p className="group-card__desc">{group.description || t('group.noDescription')}</p>
      <div className="group-card__foot">
        <span className="group-card__meta"><Icon name="users" size={16} />{t('group.members', { n: group.members_count })}</span>
        <span className="group-card__actions">
          {group.my_role === 'mentor' && <Badge tone="success">{t('roles.mentor')}</Badge>}
          {actions}
        </span>
      </div>
    </Card>
  )
}
