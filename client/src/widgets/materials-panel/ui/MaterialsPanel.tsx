import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadMaterial, MaterialRow, useDeleteMaterial, useMaterials } from '@/entities/material'
import type { Material } from '@/entities/material'
import { MaterialUpload } from '@/features/material-upload'
import { errorMessage } from '@/shared/api'
import { Button, ConfirmDialog, EmptyState, IconButton, Skeleton, useToast } from '@/shared/ui'

type Props = { groupId: string; meId: string; canManage: boolean }

export function MaterialsPanel({ groupId, meId, canManage }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { data, isPending, isError, error, refetch } = useMaterials(groupId)
  const remove = useDeleteMaterial(groupId)
  const [target, setTarget] = useState<Material | null>(null)

  const confirmDelete = () => {
    if (!target) return
    remove.mutate(target.id, {
      onSuccess: () => toast(t('materials.deleted'), 'success'),
      onError: (e) => toast(errorMessage(e), 'error'),
      onSettled: () => setTarget(null),
    })
  }
  const download = (m: Material) => downloadMaterial(m).catch((e: unknown) => toast(errorMessage(e), 'error'))

  return (
    <div className="stack">
      <MaterialUpload groupId={groupId} />
      {isPending ? (
        <div className="stack-sm" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} height={64} />)}</div>
      ) : isError ? (
        <EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="file" title={t('materials.emptyTitle')} text={t('materials.emptyText')} />
      ) : (
        <ul className="list">
          {data.items.map((m) => (
            <MaterialRow key={m.id} material={m} actions={<>
              <IconButton icon="download" size="sm" label={t('materials.download')} onClick={() => void download(m)} />
              {(canManage || m.uploader_id === meId) && <IconButton icon="trash" size="sm" label={t('common.delete')} onClick={() => setTarget(m)} />}
            </>} />
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!target} title={t('materials.deleteTitle')} text={t('materials.deleteConfirm', { title: target?.title ?? '' })} loading={remove.isPending} onConfirm={confirmDelete} onClose={() => setTarget(null)} />
    </div>
  )
}
