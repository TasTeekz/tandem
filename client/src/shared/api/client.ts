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

type RefreshResult = 'ok' | 'rejected' | 'failed'
let refreshing: Promise<RefreshResult> | null = null
/** One refresh at a time; concurrent 401s share the same promise. Only a 401 from the refresh endpoint ends the session. */
const refresh = (): Promise<RefreshResult> => {
  refreshing ??= (async (): Promise<RefreshResult> => {
    const current = getTokens()
    if (!current) return 'rejected'
    try {
      const res = await fetch(url('/auth/refresh'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: current.refresh }) })
      if (res.status === 401) { setTokens(null); return 'rejected' }
      if (!res.ok) return 'failed'
      const next = (await res.json()) as Schemas['TokenOut']
      setTokens({ access: next.access_token, refresh: next.refresh_token })
      return 'ok'
    } catch { return 'failed' }
  })().finally(() => { refreshing = null })
  return refreshing
}

const send = (method: string, path: string, o: Options) => {
  const headers: Record<string, string> = {}
  const access = getTokens()?.access
  if (o.auth !== false && access) headers.Authorization = `Bearer ${access}`
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  const res = fetch(url(path, o.query), { method, headers, body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined) })
  return res.then((r) => ({ res: r, used: access }))
}

const toError = async (res: Response) => {
  const data = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null
  return new ApiError(res.status, data?.error?.code ?? 'internal_error', data?.error?.message ?? res.statusText)
}

async function request(method: string, path: string, o: Options = {}): Promise<Response> {
  const attempt = async () => {
    try { return await send(method, path, o) } catch { throw new ApiError(0, 'network', 'Network error') }
  }
  const first = await attempt()
  const used = first.used
  let res = first.res
  if (res.status === 401 && o.auth !== false && used) {
    // A newer token already landed (parallel refresh): just retry. Otherwise refresh first.
    const stale = getTokens()?.access !== used
    if (stale || (await refresh()) === 'ok') res = (await attempt()).res
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
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
  },
}
