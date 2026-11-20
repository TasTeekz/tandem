import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Icon } from './icons'
import type { IconName } from './icons'

export const Skeleton = ({ width, height = 14, round }: { width?: number | string; height?: number | string; round?: boolean }) => (
  <span className={cn('t-skeleton', round && 't-skeleton--round')} style={{ width, height }} aria-hidden="true" />
)

type EmptyProps = { icon?: IconName; title: string; text?: string; action?: ReactNode }
export const EmptyState = ({ icon = 'users', title, text, action }: EmptyProps) => (
  <div className="t-empty">
    <span className="t-empty__art" aria-hidden="true"><Icon name={icon} size={28} /></span>
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action}
  </div>
)

export const clampPercent = (v: number) => Math.min(100, Math.max(0, Math.round(v)))

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = clampPercent(value)
  return (
    <div className="t-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
      <span className="t-bar__fill" style={{ width: `${v}%` }} />
    </div>
  )
}

export function ProgressRing({ value, label, size = 56 }: { value: number; label: string; size?: number }) {
  const v = clampPercent(value)
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <div className="t-ring" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <circle cx="24" cy="24" r={r} className="t-ring__track" />
        <circle cx="24" cy="24" r={r} className="t-ring__fill" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 24 24)" />
      </svg>
      <span className="t-ring__text t-num">{v}%</span>
    </div>
  )
}
