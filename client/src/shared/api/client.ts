import { API_BASE } from '@/shared/config'
import type { components } from './schema'
import { ApiError } from './errors'
import { getTokens, setTokens } from './session'

export type Schemas = components['schemas']
export type Page<T> = { items: T[]; total: number }
type Query = Record<string, string | number | boolean | null | undefined>
type Options = { query?: Query; body?: unknown; form?: FormData; auth?: boolean }

const url = (path: string, query?: Query) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  const s = qs.toString()
  return `${API_BASE}${path}${s ? `?${s}` : ''}`
}

let refreshing: Promise<boolean> | null = null
/** One refresh at a time; concurrent 401s share the same promise. */
const refresh = (): Promise<boolean> => {
  refreshing ??= (async () => {
    const current = getTokens()
    if (!current) return false
    try {
      const res = await fetch(url('/auth/refresh'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: current.refresh }) })
      if (!res.ok) return false
      const next = (await res.json()) as Schemas['TokenOut']
      setTokens({ access: next.access_token, refresh: next.refresh_token })
      return true
    } catch { return false }
  })().finally(() => { refreshing = null })
  return refreshing
}

const send = (method: string, path: string, o: Options) => {
  const headers: Record<string, string> = {}
  const tk = getTokens()
  if (o.auth !== false && tk) headers.Authorization = `Bearer ${tk.access}`
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  return fetch(url(path, o.query), { method, headers, body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined) })
}

const toError = async (res: Response) => {
  const data = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null
  return new ApiError(res.status, data?.error?.code ?? 'internal_error', data?.error?.message ?? res.statusText)
}

async function request(method: string, path: string, o: Options = {}): Promise<Response> {
  let res: Response
  try { res = await send(method, path, o) } catch { throw new ApiError(0, 'network', 'Network error') }
  if (res.status === 401 && o.auth !== false && getTokens()) {
    if (await refresh()) res = await send(method, path, o)
    if (res.status === 401) setTokens(null)
  }
  if (!res.ok) throw await toError(res)
  return res
}

const json = async <T>(method: string, path: string, o?: Options) => {
  const res = await request(method, path, o)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const api = {
  get: <T>(path: string, query?: Query) => json<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, auth = true) => json<T>('POST', path, { body, auth }),
  put: <T>(path: string, body?: unknown) => json<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => json<T>('PATCH', path, { body }),
  del: (path: string) => json<void>('DELETE', path),
  upload: <T>(path: string, form: FormData) => json<T>('POST', path, { form }),
  /** Fetches an authenticated file and hands it to the browser as a download. */
  async download(path: string, fileName: string) {
    const res = await request('GET', path)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(await res.blob())
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  },
}
