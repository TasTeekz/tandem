import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { Button, Checkbox, Input, Modal, Select, Textarea, useToast } from '@/shared/ui'
import { useAdminUsers, useCreateAdminGroup, useUpdateAdminGroup } from '../api/admin'
import type { AdminGroup } from '../api/admin'

type Props = { open: boolean; onClose: () => void; group?: AdminGroup }

export function AdminGroupFormModal(props: Props) {
  return props.open ? <Form {...props} /> : null
}

function Form({ open, onClose, group }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateAdminGroup()
  const update = useUpdateAdminGroup()
  const mutation = group ? update : create
  const users = useAdminUsers({ q: '', page: 1, pageSize: 100 })
  const [title, setTitle] = useState(group?.title ?? '')
  const [subject, setSubject] = useState(group?.subject ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [isPublic, setPublic] = useState(group?.is_public ?? true)
  const [owner, setOwner] = useState(group?.owner_id ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const done = { onSuccess: () => { toast(t('admin.saved'), 'success'); onClose() } }
    const base = { title: title.trim(), subject: subject.trim() || null, description: description.trim() || null, is_public: isPublic }
    if (group) update.mutate({ id: group.id, ...base, owner_id: owner || null }, done)
    else create.mutate({ ...base, owner_id: owner }, done)
  }

  return (
    <Modal open={open} onClose={onClose} title={t(group ? 'admin.groups.edit' : 'admin.groups.create')}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="admin-group-form" loading={mutation.isPending} disabled={!title.trim() || !owner}>{t('common.save')}</Button>
      </>}>
      <form id="admin-group-form" className="form-stack" onSubmit={submit}>
        <Input label={t('group.title')} required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label={t('group.subject')} maxLength={80} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea label={t('group.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select label={t('admin.groups.owner')} required value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="" disabled>{t('admin.groups.pickOwner')}</option>
          {users.data?.items.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
        </Select>
        <Checkbox label={t('group.publicHint')} checked={isPublic} onChange={(e) => setPublic(e.target.checked)} />
        {mutation.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(mutation.error)}</p>}
      </form>
    </Modal>
  )
}
