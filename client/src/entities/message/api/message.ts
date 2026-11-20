import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'
import { POLL_MS } from '@/shared/config'

export type Message = Schemas['MessageOut']
const key = (groupId: string) => ['messages', groupId] as const

/** Dedupes by id and keeps (created_at, id) order, so a slow poll overlapping a send cannot reorder messages. */
export const mergeMessages = (prev: Message[] | undefined, next: Message[]) => {
  const seen = new Set((prev ?? []).map((m) => m.id))
  return [...(prev ?? []), ...next.filter((m) => !seen.has(m.id))].sort(
    (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  )
}

/** First fetch loads the latest 50; every poll asks only for messages newer than the last cached id. */
export function useMessages(groupId: string) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: key(groupId),
    queryFn: async () => {
      const prev = qc.getQueryData<Message[]>(key(groupId))
      const after = prev?.at(-1)?.id
      const res = await api.get<Page<Message>>(`/groups/${groupId}/messages`, after ? { after, limit: 100 } : { limit: PAGE_SIZE })
      return mergeMessages(prev, res.items)
    },
    refetchInterval: POLL_MS,
    staleTime: 0,
    gcTime: 0,
  })
}

export const PAGE_SIZE = 50

/** Prepends the page before the oldest cached message; resolves with how many were fetched. */
export function useLoadEarlier(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const before = qc.getQueryData<Message[]>(key(groupId))?.[0]?.id
      if (!before) return 0
      const res = await api.get<Page<Message>>(`/groups/${groupId}/messages`, { before, limit: PAGE_SIZE })
      qc.setQueryData<Message[]>(key(groupId), (prev = []) => [...res.items.filter((m) => !prev.some((p) => p.id === m.id)), ...prev])
      return res.items.length
    },
  })
}

export function useSendMessage(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.post<Message>(`/groups/${groupId}/messages`, { body }),
    onSuccess: (m) => qc.setQueryData<Message[]>(key(groupId), (prev) => mergeMessages(prev, [m])),
  })
}
