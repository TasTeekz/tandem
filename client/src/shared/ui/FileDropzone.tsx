import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { Icon } from './icons'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
type DropzoneProps = { onFile: (file: File) => void; accept?: string; disabled?: boolean }

export function FileDropzone({ onFile, accept, disabled }: DropzoneProps) {
  const { t } = useTranslation()
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const take = (file?: File) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) return setError(t('common.tooManyBytes'))
    setError(null)
    onFile(file)
  }

  return (
    <div>
      <label
        htmlFor={id}
        className={cn('t-drop', over && 't-drop--over', disabled && 't-drop--disabled')}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files[0]) }}
      >
        <span className="t-drop__icon"><Icon name="upload" size={26} /></span>
        <span className="t-drop__title">{t('common.dropFiles')}</span>
        <span className="t-drop__hint">{t('common.dropHint')}</span>
        <input id={id} type="file" accept={accept} disabled={disabled} className="t-sr" onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {error && <p className="t-field__msg t-field__msg--error" role="alert">{error}</p>}
    </div>
  )
}
