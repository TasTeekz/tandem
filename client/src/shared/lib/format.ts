import { useEffect, useState } from 'react'

export const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Date-only strings (goal due dates) are calendar days: format in UTC so negative-offset zones do not show the day before. */
export const formatDate = (iso: string, lng: string, withTime = false) =>
  new Intl.DateTimeFormat(lng, {
    ...(withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }),
    ...(DATE_ONLY.test(iso) ? { timeZone: 'UTC' } : {}),
  }).format(new Date(iso))

export const formatTime = (iso: string, lng: string) => new Intl.DateTimeFormat(lng, { timeStyle: 'short' }).format(new Date(iso))

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}
