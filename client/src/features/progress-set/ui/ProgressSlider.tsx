import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSetProgress } from '@/entities/goal'
import type { Goal } from '@/entities/goal'
import { errorMessage } from '@/shared/api'
import { useToast } from '@/shared/ui'
import './progress-slider.css'

/** Drag freely; the value is saved when the pointer, key or focus leaves the slider. */
export function ProgressSlider({ groupId, goal }: { groupId: string; goal: Goal }) {
  const { t } = useTranslation()
  const toast = useToast()
  const set = useSetProgress(groupId)
  const [value, setValue] = useState(goal.my_percent)
  const [synced, setSynced] = useState(goal.my_percent)
  if (synced !== goal.my_percent) { setSynced(goal.my_percent); setValue(goal.my_percent) }

  const commit = () => {
    if (value === goal.my_percent || set.isPending) return
    set.mutate({ id: goal.id, percent: value }, { onError: (e) => { toast(errorMessage(e), 'error'); setValue(goal.my_percent) } })
  }

  return (
    <label className="pslider">
      <span className="pslider__label">{t('goals.myProgress')}</span>
      <input
        type="range" min={0} max={100} step={5} value={value} className="pslider__range" style={{ '--p': `${value}%` } as React.CSSProperties}
        aria-valuetext={`${value}%`} onChange={(e) => setValue(Number(e.target.value))}
        onPointerUp={commit} onKeyUp={commit} onBlur={commit}
      />
      <output className="pslider__value t-num">{value}%</output>
    </label>
  )
}
