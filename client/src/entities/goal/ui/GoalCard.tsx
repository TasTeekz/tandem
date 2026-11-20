import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib'
import { Badge, Icon } from '@/shared/ui'
import type { Goal } from '../api/goal'
import './goal-card.css'

const isOverdue = (due: string | null, percent: number) => !!due && percent < 100 && new Date(`${due}T23:59:59`) < new Date()

export function GoalCard({ goal, actions, children }: { goal: Goal; actions?: ReactNode; children?: ReactNode }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="goal-card">
      <div className="goal-card__head">
        <span className="goal-card__icon"><Icon name="target" size={20} /></span>
        <div className="goal-card__main">
          <h3 className="goal-card__title">{goal.title}</h3>
          {goal.description && <p className="goal-card__desc">{goal.description}</p>}
        </div>
        {actions}
      </div>
      {goal.due_date && (
        <Badge tone={isOverdue(goal.due_date, goal.my_percent) ? 'danger' : 'neutral'}>
          {t('goals.due', { date: formatDate(goal.due_date, i18n.language) })}
        </Badge>
      )}
      {children}
    </li>
  )
}
