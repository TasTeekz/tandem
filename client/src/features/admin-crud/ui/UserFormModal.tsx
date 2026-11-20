import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { LOCALES } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { Button, Checkbox, Input, Modal, Select, useToast } from '@/shared/ui'
import { useCreateUser, useUpdateUser } from '../api/admin'
import type { AdminUser } from '../api/admin'

type Props = { open: boolean; onClose: () => void; user?: AdminUser; isSelf?: boolean }

export function UserFormModal(props: Props) {
  return props.open ? <Form {...props} /> : null
}

function Form({ open, onClose, user, isSelf }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateUser()
  const update = useUpdateUser()
  const mutation = user ? update : create
  const [email, setEmail] = useState(user?.email ?? '')
  const [name, setName] = useState(user?.full_name ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminUser['role']>(user?.role ?? 'student')
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'en')
  const [active, setActive] = useState(user?.is_active ?? true)
  const badPassword = user ? password.length > 0 && password.length < 8 : password.length < 8

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const done = { onSuccess: () => { toast(t('admin.saved'), 'success'); onClose() } }
    const base = { email: email.trim(), full_name: name.trim(), role, locale, is_active: active }
    if (user) update.mutate({ id: user.id, ...base, password: password || null }, done)
    else create.mutate({ ...base, password }, done)
  }

  return (
    <Modal open={open} onClose={onClose} title={t(user ? 'admin.users.edit' : 'admin.users.create')}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="user-form" loading={mutation.isPending} disabled={!email || !name.trim() || badPassword}>{t('common.save')}</Button>
      </>}>
      <form id="user-form" className="form-stack" onSubmit={submit}>
        <Input label={t('auth.fullName')} required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('auth.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={t('auth.password')} type="password" autoComplete="new-password" required={!user} maxLength={128} value={password} hint={user ? t('admin.users.passwordKeep') : t('auth.passwordHint')} onChange={(e) => setPassword(e.target.value)} />
        <Select label={t('admin.users.role')} value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value as AdminUser['role'])}>
          <option value="student">{t('roles.student')}</option>
          <option value="admin">{t('roles.admin')}</option>
        </Select>
        <Select label={t('common.language')} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
          {LOCALES.map((l) => <option key={l} value={l}>{t(`locale.${l}`)}</option>)}
        </Select>
        <Checkbox label={t('admin.users.active')} checked={active} disabled={isSelf} onChange={(e) => setActive(e.target.checked)} />
        {mutation.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(mutation.error)}</p>}
      </form>
    </Modal>
  )
}
