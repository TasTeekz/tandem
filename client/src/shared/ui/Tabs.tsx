import { useId } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export type TabItem = { id: string; label: string; content: ReactNode }
type TabsProps = { items: TabItem[]; value: string; onChange: (id: string) => void; label: string }

export function Tabs({ items, value, onChange, label }: TabsProps) {
  const base = useId()
  const onKey = (e: KeyboardEvent) => {
    const i = items.findIndex((x) => x.id === value)
    const step: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 }
    const next = step[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = items[(next + items.length) % items.length]
    if (!target) return
    onChange(target.id)
    document.getElementById(`${base}-tab-${target.id}`)?.focus()
  }
  const active = items.find((x) => x.id === value)
  return (
    <div className="t-tabs">
      <div className="t-tabs__list" role="tablist" aria-label={label} onKeyDown={onKey}>
        {items.map((it) => (
          <button key={it.id} id={`${base}-tab-${it.id}`} role="tab" type="button" aria-selected={it.id === value} aria-controls={`${base}-panel`} tabIndex={it.id === value ? 0 : -1} className="t-tabs__tab" onClick={() => onChange(it.id)}>
            {it.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${value}`} className="t-tabs__panel">
        {active?.content}
      </div>
    </div>
  )
}
