import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateGroup, useUpdateGroup } from '@/entities/group'
import type { Group } from '@/entities/group'
import { errorMessage } from '@/shared/api'
import { Button, Checkbox, Input, Modal, Textarea, useToast } from '@/shared/ui'

type Props = { open: boolean; onClose: () => void; group?: Group; onSaved?: (g: Group) => void }

/** Create when `group` is absent, edit otherwise. The form remounts per open so fields always start from the group. */
export function GroupFormModal(props: Props) {
  return props.open ? <Form {...props} /> : null
}

function Form({ open, onClose, group, onSaved }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateGroup()
  const update = useUpdateGroup(group?.id ?? '')
  const mutation = group ? update : create
  const [title, setTitle] = useState(group?.title ?? '')
  const [subject, setSubject] = useState(group?.subject ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [isPublic, setPublic] = useState(group?.is_public ?? true)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = { title: title.trim(), subject: subject.trim() || null, description: description.trim() || null, is_public: isPublic }
    mutation.mutate(body, {
      onSuccess: (saved) => { toast(t(group ? 'group.saved' : 'group.created'), 'success'); onSaved?.(saved as Group); onClose() },
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={t(group ? 'group.editTitle' : 'group.createTitle')}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="group-form" loading={mutation.isPending} disabled={!title.trim()}>{t(group ? 'common.save' : 'common.create')}</Button>
      </>}>
      <form id="group-form" className="form-stack" onSubmit={submit}>
        <Input label={t('group.title')} required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label={t('group.subject')} maxLength={80} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea label={t('group.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Checkbox label={t('group.publicHint')} checked={isPublic} onChange={(e) => setPublic(e.target.checked)} />
        {mutation.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(mutation.error)}</p>}
      </form>
    </Modal>
  )
}
