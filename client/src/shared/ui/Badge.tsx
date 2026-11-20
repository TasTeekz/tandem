import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/shared/lib'

export type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'danger'
export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={cn('t-badge', `t-badge--${tone}`)}>{children}</span>
)

export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.38, '--h': hue(name) } as CSSProperties
  return <span className="t-avatar" role="img" aria-label={name} style={style}>{initials(name)}</span>
}
