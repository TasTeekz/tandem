import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/ui'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="page page--narrow">
      <EmptyState icon="search" title={t('notFound.title')} text={t('notFound.text')} action={<Link to="/">{t('notFound.home')}</Link>} />
    </div>
  )
}
