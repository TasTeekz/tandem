import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useSession } from '@/entities/user'
import { ForbiddenPage } from '@/pages/forbidden'
import { safeNext } from '@/shared/lib'
import { Spinner } from '@/shared/ui'

export function PageLoader() {
  const { t } = useTranslation()
  return <div className="page-loader"><Spinner size={28} label={t('common.loading')} /></div>
}

export function RequireAuth() {
  const { status } = useSession()
  const loc = useLocation()
  if (status === 'loading') return <PageLoader />
  if (status === 'guest') return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin } = useSession()
  return isAdmin ? <Outlet /> : <ForbiddenPage />
}

export function GuestOnly() {
  const { status } = useSession()
  const [params] = useSearchParams()
  if (status === 'loading') return <PageLoader />
  if (status === 'authed') return <Navigate to={safeNext(params.get('next'))} replace />
  return <Outlet />
}
