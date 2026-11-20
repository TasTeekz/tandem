import { useTranslation } from 'react-i18next'
import { useSession, useUpdateProfile } from '@/entities/user'
import { LOCALES, setLocale } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { Icon, Menu } from '@/shared/ui'
import './locale-switch.css'

/** Persists to localStorage always, and to the profile when logged in. */
export function LocaleSwitch() {
  const { t, i18n } = useTranslation()
  const { status } = useSession()
  const update = useUpdateProfile()
  const pick = (l: Locale) => {
    setLocale(l)
    if (status === 'authed') update.mutate({ locale: l })
  }
  return (
    <Menu
      align="end" label={t('common.language')}
      trigger={<span className="locale-trigger" title={t('common.language')}><Icon name="globe" size={18} /><span aria-hidden="true">{i18n.language.toUpperCase()}</span><span className="t-sr">{t('common.language')}</span></span>}
      items={LOCALES.map((l) => ({ id: l, label: t(`locale.${l}`), icon: l === i18n.language ? 'check' : undefined, onSelect: () => pick(l) }))}
    />
  )
}
