import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegister } from '@/entities/user'
import { errorMessage } from '@/shared/api'
import type { Locale } from '@/shared/i18n'
import { Button, Input } from '@/shared/ui'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { t, i18n } = useTranslation()
  const register = useRegister()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const shortPassword = password.length > 0 && password.length < 8

  const submit = (e: FormEvent) => {
    e.preventDefault()
    register.mutate({ full_name: name.trim(), email: email.trim(), password, locale: i18n.language as Locale }, { onSuccess })
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <Input label={t('auth.fullName')} autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      <Input label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label={t('auth.password')} type="password" autoComplete="new-password" required maxLength={128} value={password}
        hint={t('auth.passwordHint')} error={shortPassword ? t('auth.passwordHint') : undefined}
        onChange={(e) => setPassword(e.target.value)}
      />
      {register.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(register.error)}</p>}
      <Button type="submit" size="lg" block loading={register.isPending} disabled={!name.trim() || !email || password.length < 8}>{t('auth.register')}</Button>
    </form>
  )
}
