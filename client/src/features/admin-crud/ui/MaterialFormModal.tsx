import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { Button, FileDropzone, Input, Modal, Select, useToast } from '@/shared/ui'
import { useAdminGroups, useCreateAdminMaterial, useUpdateAdminMaterial } from '../api/admin'
import type { AdminMaterial } from '../api/admin'

type Props = { open: boolean; onClose: () => void; material?: AdminMaterial }

/** Edit renames; create uploads a file into a chosen group through the regular upload endpoint. */
export function AdminMaterialFormModal(props: Props) {
  return props.open ? <Form {...props} /> : null
}

function Form({ open, onClose, material }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateAdminMaterial()
  const update = useUpdateAdminMaterial()
  const mutation = material ? update : create
  const groups = useAdminGroups({ q: '', page: 1, pageSize: 100 })
  const [title, setTitle] = useState(material?.title ?? '')
  const [groupId, setGroupId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const done = { onSuccess: () => { toast(t('admin.saved'), 'success'); onClose() } }
    if (material) update.mutate({ id: material.id, title: title.trim() }, done)
    else if (file) create.mutate({ groupId, file, title: title.trim() }, done)
  }

  const ready = material ? !!title.trim() : !!file && !!groupId
  return (
    <Modal open={open} onClose={onClose} title={t(material ? 'admin.materials.edit' : 'admin.materials.create')}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="admin-material-form" loading={mutation.isPending} disabled={!ready}>{t('common.save')}</Button>
      </>}>
      <form id="admin-material-form" className="form-stack" onSubmit={submit}>
        {!material && (
          <Select label={t('admin.materials.group')} required value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="" disabled>{t('admin.materials.pickGroup')}</option>
            {groups.data?.items.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </Select>
        )}
        <Input label={t('materials.title')} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} hint={material ? undefined : t('admin.materials.titleHint')} />
        {!material && <FileDropzone onFile={setFile} />}
        {file && <p className="t-field__msg">{file.name}</p>}
        {mutation.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(mutation.error)}</p>}
      </form>
    </Modal>
  )
}
