import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginForm } from '@/features/auth-login'
import { Logo } from '@/shared/assets'
import { safeNext } from '@/shared/lib'
import { Card } from '@/shared/ui'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  return (
    <div className="page page--narrow">
      <Card className="auth-card">
        <Logo size={36} />
        <div><h1>{t('auth.loginTitle')}</h1><p className="muted">{t('auth.loginSub')}</p></div>
        <LoginForm onSuccess={() => navigate(next, { replace: true })} />
        <p className="muted">{t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link></p>
      </Card>
    </div>
  )
}
