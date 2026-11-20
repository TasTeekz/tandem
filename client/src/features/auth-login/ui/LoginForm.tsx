import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLogin } from '@/entities/user'
import { errorMessage } from '@/shared/api'
import { Button, Input } from '@/shared/ui'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({ email: email.trim(), password }, { onSuccess })
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <Input label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label={t('auth.password')} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {login.isError && <p className="t-field__msg t-field__msg--error" role="alert">{errorMessage(login.error)}</p>}
      <Button type="submit" size="lg" block loading={login.isPending} disabled={!email || !password}>{t('auth.login')}</Button>
    </form>
  )
}
