import { cloneElement, useId } from 'react'
import type { ReactElement } from 'react'

export function Tooltip({ text, children }: { text: string; children: ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = useId()
  return (
    <span className="t-tip">
      {cloneElement(children, { 'aria-describedby': id })}
      <span role="tooltip" id={id} className="t-tip__bubble">{text}</span>
    </span>
  )
}
