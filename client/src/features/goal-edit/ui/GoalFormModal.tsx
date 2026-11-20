import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateGoal, useUpdateGoal } from '@/entities/goal'
import type { Goal } from '@/entities/goal'
import { errorMessage } from '@/shared/api'
import { Button, Input, Modal, Textarea, useToast } from '@/shared/ui'

type Props = { open: boolean; onClose: () => void; groupId: string; goal?: Goal }

export function GoalFormModal(props: Props) {
  return props.open ? <Form {...props} /> : null
}

function Form({ open, onClose, groupId, goal }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateGoal(groupId)
  const update = useUpdateGoal(groupId)
  const mutation = goal ? update : create
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [due, setDue] = useState(goal?.due_date ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = { title: title.trim(), description: description.trim() || null, due_date: due || null }
    const done = { onSuccess: () => { toast(t('goals.saved'), 'success'); onClose() } }
    if (goal) update.mutate({ id: goal.id, ...body }, done)
    else create.mutate(body, done)
  }

  return (
    <Modal open={open} onClose={onClose} title={t(goal ? 'goals.editTitle' : 'goals.createTitle')}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="goal-form" loading={mutation.isPending} disabled={!title.trim()}>{t(goal ? 'common.save' : 'common.create')}</Button>
      </>}>
      <form id="goal-form" className="form-stack" onSubmit={submit}>
        <Input label={t('goals.title')} required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label={t('goals.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label={t('goals.dueDate')} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        {mutation.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(mutation.error)}</p>}
      </form>
    </Modal>
  )
}
