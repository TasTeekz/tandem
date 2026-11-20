import { useTranslation } from 'react-i18next'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useUnreadCount } from '@/entities/notification'
import { useLogout, useSession } from '@/entities/user'
import { LocaleSwitch } from '@/features/locale-switch'
import { Logo } from '@/shared/assets'
import { useTheme } from '@/shared/lib'
import { Avatar, Button, IconButton, Menu } from '@/shared/ui'
import './header.css'

const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

function NotificationBell() {
  const { t } = useTranslation()
  const { data: unread = 0 } = useUnreadCount()
  const navigate = useNavigate()
  return (
    <span className="hdr__bell">
      <IconButton icon="bell" label={unread > 0 ? t('notifications.bellUnread', { n: unread }) : t('notifications.title')} onClick={() => navigate('/notifications')} />
      {unread > 0 && <span className="hdr__badge t-num" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
    </span>
  )
}

export function Header() {
  const { t } = useTranslation()
  const { status, user, isAdmin } = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark' || (theme === 'system' && prefersDark())
  const authed = status === 'authed' && user

  return (
    <header className="hdr">
      <a className="hdr__skip" href="#main">{t('common.skipToContent')}</a>
      <div className="hdr__inner">
        <Link to="/" className="hdr__logo" aria-label="Tandem"><Logo size={30} /></Link>
        <nav className="hdr__nav" aria-label={t('nav.main')}>
          {authed ? (
            <>
              <NavLink to="/groups">{t('nav.groups')}</NavLink>
              <NavLink to="/search">{t('nav.search')}</NavLink>
              {isAdmin && <NavLink to="/admin">{t('nav.admin')}</NavLink>}
            </>
          ) : (
            <NavLink to="/" end>{t('nav.explore')}</NavLink>
          )}
        </nav>
        <div className="hdr__tools">
          <LocaleSwitch />
          <IconButton icon={dark ? 'sun' : 'moon'} label={t('common.toggleTheme')} onClick={() => setTheme(dark ? 'light' : 'dark')} />
          {authed ? (
            <>
              <NotificationBell />
              <Menu
                align="end" label={t('nav.userMenu')}
                trigger={<span className="hdr__user"><Avatar name={user.full_name} size={34} /></span>}
                items={[
                  { id: 'profile', label: t('nav.profile'), icon: 'user', onSelect: () => navigate('/profile') },
                  { id: 'out', label: t('auth.logout'), icon: 'logout', danger: true, onSelect: () => { logout(); navigate('/') } },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('auth.login')}</Button>
              <Button size="sm" onClick={() => navigate('/register')}>{t('auth.register')}</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
