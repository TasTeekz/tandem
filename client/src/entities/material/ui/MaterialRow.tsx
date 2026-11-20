import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBytes, formatDate } from '@/shared/lib'
import { Icon } from '@/shared/ui'
import type { Material } from '../api/material'
import './material-row.css'

export function MaterialRow({ material, actions }: { material: Material; actions?: ReactNode }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="material-row">
      <span className="material-row__icon"><Icon name="file" size={22} /></span>
      <div className="material-row__main">
        <span className="material-row__title">{material.title}</span>
        <span className="material-row__sub t-num">
          {material.file_name} · {formatBytes(material.size_bytes)} · {t('materials.by', { name: material.uploader_name })} · {formatDate(material.created_at, i18n.language)}
        </span>
      </div>
      {actions && <span className="material-row__actions">{actions}</span>}
    </li>
  )
}
