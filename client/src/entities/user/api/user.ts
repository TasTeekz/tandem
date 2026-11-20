import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, setTokens, useHasTokens } from '@/shared/api'
import type { Schemas } from '@/shared/api'
import { setLocale } from '@/shared/i18n'

export type User = Schemas['UserOut']
export const meKey = ['me'] as const

type Status = 'loading' | 'guest' | 'authed'

/** Current session: tokens decide guest vs. logged in, `/auth/me` supplies the user. */
export function useSession(): { status: Status; user: User | null; isAdmin: boolean } {
  const hasTokens = useHasTokens()
  const q = useQuery({ queryKey: meKey, queryFn: () => api.get<User>('/auth/me'), enabled: hasTokens, staleTime: Infinity, retry: false })
  const user = hasTokens ? (q.data ?? null) : null
  const status: Status = !hasTokens || q.isError ? 'guest' : user ? 'authed' : 'loading'
  return { status, user, isAdmin: user?.role === 'admin' }
}

const useStartSession = () => {
  const qc = useQueryClient()
  return (out: Schemas['AuthOut']) => {
    setTokens({ access: out.access_token, refresh: out.refresh_token })
    qc.setQueryData(meKey, out.user)
    setLocale(out.user.locale)
  }
}

export function useLogin() {
  const start = useStartSession()
  return useMutation({ mutationFn: (body: Schemas['LoginIn']) => api.post<Schemas['AuthOut']>('/auth/login', body, false), onSuccess: start })
}

export function useRegister() {
  const start = useStartSession()
  return useMutation({ mutationFn: (body: Schemas['RegisterIn']) => api.post<Schemas['AuthOut']>('/auth/register', body, false), onSuccess: start })
}

export function useLogout() {
  const qc = useQueryClient()
  return () => { setTokens(null); qc.clear() }
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['ProfileUpdate']) => api.patch<User>('/profile', body),
    onSuccess: (user) => qc.setQueryData(meKey, user),
  })
}
