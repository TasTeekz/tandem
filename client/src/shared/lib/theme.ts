import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'tandem-theme'

const read = (): Theme => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch { return 'system' }
}

const apply = (t: Theme) => {
  if (t === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = t
  try {
    if (t === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, t)
  } catch { /* storage blocked */ }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read)
  const set = useCallback((t: Theme) => { apply(t); setTheme(t) }, [])
  return { theme, setTheme: set }
}
