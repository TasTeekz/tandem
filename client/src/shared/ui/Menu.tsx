import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Icon } from './icons'
import type { IconName } from './icons'

export type MenuItem = { id: string; label: string; icon?: IconName; danger?: boolean; onSelect: () => void }
type MenuProps = { trigger: ReactNode; items: MenuItem[]; label: string; align?: 'start' | 'end' }

export function Menu({ trigger, items, label, align = 'start' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    root.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const onKey = (e: KeyboardEvent) => {
    const els = [...(root.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
    const i = els.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      setOpen(false)
      root.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      els[(i + 1) % els.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      els[(i - 1 + els.length) % els.length]?.focus()
    }
  }

  return (
    <div className="t-menu" ref={root} onKeyDown={onKey}>
      <button type="button" className="t-menu__trigger" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((o) => !o)}>
        {trigger}
      </button>
      {open && (
        <ul id={id} role="menu" aria-label={label} className={cn('t-menu__list', align === 'end' && 't-menu__list--end')}>
          {items.map((it) => (
            <li key={it.id} role="none">
              <button type="button" role="menuitem" className={cn('t-menu__item', it.danger && 't-menu__item--danger')} onClick={() => { setOpen(false); it.onSelect() }}>
                {it.icon && <Icon name={it.icon} size={18} />}
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
