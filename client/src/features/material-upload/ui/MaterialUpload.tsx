import { useTranslation } from 'react-i18next'
import { useUploadMaterial } from '@/entities/material'
import { errorMessage } from '@/shared/api'
import { FileDropzone, Spinner, useToast } from '@/shared/ui'

export function MaterialUpload({ groupId }: { groupId: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const upload = useUploadMaterial(groupId)
  return (
    <div className="stack-sm">
      <FileDropzone disabled={upload.isPending} onFile={(file) => upload.mutate(file, { onSuccess: () => toast(t('materials.uploaded'), 'success'), onError: (e) => toast(errorMessage(e), 'error') })} />
      {upload.isPending && <p className="inline-status"><Spinner size={14} label={t('common.loading')} /> {t('materials.uploading')}</p>}
    </div>
  )
}
