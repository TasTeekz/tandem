import { useTranslation } from 'react-i18next'
import { Icon, Input } from '@/shared/ui'

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <Input
      label={t('search.label')} type="search" value={value} maxLength={100} autoFocus
      placeholder={t('search.placeholder')} leading={<Icon name="search" size={18} />}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
