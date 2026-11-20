import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

type CardProps = HTMLAttributes<HTMLDivElement> & { interactive?: boolean; flush?: boolean }
export function Card({ interactive, flush, className, ...rest }: CardProps) {
  return <div className={cn('t-card', interactive && 't-card--interactive', flush && 't-card--flush', className)} {...rest} />
}
