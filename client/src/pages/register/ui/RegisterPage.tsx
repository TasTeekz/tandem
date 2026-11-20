import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterForm } from '@/features/auth-register'
import { Logo } from '@/shared/assets'
import { Card } from '@/shared/ui'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="page page--narrow">
      <Card className="auth-card">
        <Logo size={36} />
        <div><h1>{t('auth.registerTitle')}</h1><p className="muted">{t('auth.registerSub')}</p></div>
        <RegisterForm onSuccess={() => navigate('/groups', { replace: true })} />
        <p className="muted">{t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link></p>
      </Card>
    </div>
  )
}
