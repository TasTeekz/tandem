import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/ui'

export function ForbiddenPage() {
  const { t } = useTranslation()
  return (
    <div className="page page--narrow">
      <EmptyState icon="lock" title={t('forbidden.title')} text={t('forbidden.text')} action={<Link to="/">{t('notFound.home')}</Link>} />
    </div>
  )
}
