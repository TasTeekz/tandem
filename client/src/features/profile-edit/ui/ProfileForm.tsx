import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateProfile } from '@/entities/user'
import type { User } from '@/entities/user'
import { errorMessage } from '@/shared/api'
import { LOCALES, setLocale } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { useTheme } from '@/shared/lib'
import type { Theme } from '@/shared/lib'
import { Button, Input, Select, useToast } from '@/shared/ui'

const THEMES: Theme[] = ['system', 'light', 'dark']

export function ProfileForm({ user }: { user: User }) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const update = useUpdateProfile()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user.full_name)
  // Only an explicit pick overrides the live language, so a header switch is not reverted by saving the form.
  const [picked, setPicked] = useState<Locale | null>(null)
  const locale = picked ?? (i18n.language as Locale)
  const [password, setPassword] = useState('')
  const shortPassword = password.length > 0 && password.length < 8

  const submit = (e: FormEvent) => {
    e.preventDefault()
    update.mutate(
      { full_name: name.trim(), locale, password: password || null },
      { onSuccess: () => { setLocale(locale); setPassword(''); toast(t('profile.saved'), 'success') }, onError: (err) => toast(errorMessage(err), 'error') },
    )
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <Input label={t('auth.email')} value={user.email} readOnly disabled />
      <Input label={t('auth.fullName')} required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      <Select label={t('common.language')} value={locale} onChange={(e) => setPicked(e.target.value as Locale)}>
        {LOCALES.map((l) => <option key={l} value={l}>{t(`locale.${l}`)}</option>)}
      </Select>
      <Select label={t('common.theme')} value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
        {THEMES.map((th) => <option key={th} value={th}>{t(`theme.${th}`)}</option>)}
      </Select>
      <Input label={t('profile.newPassword')} type="password" autoComplete="new-password" maxLength={128} value={password} hint={t('profile.newPasswordHint')} error={shortPassword ? t('auth.passwordHint') : undefined} onChange={(e) => setPassword(e.target.value)} />
      <div><Button type="submit" loading={update.isPending} disabled={!name.trim() || shortPassword}>{t('common.save')}</Button></div>
    </form>
  )
}
