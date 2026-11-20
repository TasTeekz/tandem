import { useSyncExternalStore } from 'react'

const KEY = 'tandem-auth'
export type Tokens = { access: string; refresh: string }

const read = (): Tokens | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch { return null }
}

let tokens = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const getTokens = () => tokens

export function setTokens(next: Tokens | null) {
  tokens = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch { /* storage blocked: session lives in memory */ }
  emit()
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }
/** True while an access/refresh token pair is stored (says nothing about validity). */
export const useHasTokens = () => useSyncExternalStore(subscribe, () => tokens !== null)
