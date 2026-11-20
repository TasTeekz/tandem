import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Icon } from './icons'
import type { IconName } from './icons'

export function Spinner({ size = 18, label }: { size?: number; label?: string }) {
  return <span className="t-spinner" role={label ? 'status' : undefined} aria-label={label} style={{ width: size, height: size }} />
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: IconName
  block?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={cn('t-btn', `t-btn--${variant}`, `t-btn--${size}`, block && 't-btn--block', className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size={16} /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

type IconButtonProps = Omit<ButtonProps, 'children' | 'icon' | 'block'> & { icon: IconName; label: string; children?: ReactNode }

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('t-btn', 't-btn--icon', `t-btn--${variant}`, `t-btn--${size}`, className)} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
    </button>
  )
}
