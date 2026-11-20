import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, formatDate } from '@/shared/lib'
import { Icon } from '@/shared/ui'
import type { IconName } from '@/shared/ui'
import type { Notification } from '../api/notification'
import './notification-item.css'

const icons: Record<Notification['type'], IconName> = { new_message: 'chat', new_material: 'file', new_goal: 'target', progress_milestone: 'check' }

export function NotificationItem({ notification: n, actions }: { notification: Notification; actions?: ReactNode }) {
  const { t, i18n } = useTranslation()
  return (
    <li className={cn('notif', !n.is_read && 'notif--unread')}>
      <span className="notif__icon"><Icon name={icons[n.type]} size={20} /></span>
      <div className="notif__main">
        <span className="notif__title">{n.title}</span>
        <span className="notif__body">{n.body}</span>
        <span className="notif__meta t-num">{t(`notifications.type.${n.type}`)} · {formatDate(n.created_at, i18n.language, true)}</span>
      </div>
      {actions}
    </li>
  )
}
