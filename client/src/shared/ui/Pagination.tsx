import { useTranslation } from 'react-i18next'
import { IconButton } from './Button'

type PaginationProps = { page: number; total: number; onChange: (page: number) => void }

export function Pagination({ page, total, onChange }: PaginationProps) {
  const { t } = useTranslation()
  return (
    <nav className="t-pager" aria-label="Pagination">
      <IconButton icon="chevronLeft" label={t('common.previous')} variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} />
      <span className="t-pager__text t-num" aria-live="polite">{t('common.page', { page, total })}</span>
      <IconButton icon="chevronRight" label={t('common.next')} variant="secondary" disabled={page >= total} onClick={() => onChange(page + 1)} />
    </nav>
  )
}
