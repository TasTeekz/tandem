import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib'
import { Avatar, Badge } from '@/shared/ui'
import type { Member } from '../api/member'
import './member-row.css'

export function MemberRow({ member, isMe, actions }: { member: Member; isMe: boolean; actions?: ReactNode }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="member-row">
      <Avatar name={member.full_name} size={40} />
      <div className="member-row__main">
        <span className="member-row__name">{member.full_name}{isMe && <span className="member-row__me"> {t('members.you')}</span>}</span>
        <span className="member-row__sub">{t('members.joined', { date: formatDate(member.joined_at, i18n.language) })}</span>
      </div>
      <Badge tone={member.role === 'mentor' ? 'success' : 'neutral'}>{t(`roles.${member.role}`)}</Badge>
      {actions}
    </li>
  )
}
