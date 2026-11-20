import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'
import { POLL_MS } from '@/shared/config'

export type Message = Schemas['MessageOut']
const key = (groupId: string) => ['messages', groupId] as const

const merge = (prev: Message[] | undefined, next: Message[]) => {
  const seen = new Set((prev ?? []).map((m) => m.id))
  return [...(prev ?? []), ...next.filter((m) => !seen.has(m.id))]
}

/** First fetch loads the latest 50; every poll asks only for messages newer than the last cached id. */
export function useMessages(groupId: string) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: key(groupId),
    queryFn: async () => {
      const prev = qc.getQueryData<Message[]>(key(groupId))
      const after = prev?.at(-1)?.id
      const res = await api.get<Page<Message>>(`/groups/${groupId}/messages`, after ? { after, limit: 100 } : { limit: 50 })
      return merge(prev, res.items)
    },
    refetchInterval: POLL_MS,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useSendMessage(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.post<Message>(`/groups/${groupId}/messages`, { body }),
    onSuccess: (m) => qc.setQueryData<Message[]>(key(groupId), (prev) => merge(prev, [m])),
  })
}
