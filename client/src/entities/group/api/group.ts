import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'

export type Group = Schemas['GroupOut']
export const groupsKey = ['groups'] as const

type ListParams = { q?: string; page: number; pageSize: number }

export const useGroups = ({ q, page, pageSize }: ListParams) =>
  useQuery({
    queryKey: [...groupsKey, 'public', q, page, pageSize],
    queryFn: () => api.get<Page<Group>>('/groups', { q, limit: pageSize, offset: (page - 1) * pageSize }),
    placeholderData: keepPreviousData,
  })

export const useMyGroups = () =>
  useQuery({ queryKey: [...groupsKey, 'mine'], queryFn: () => api.get<Page<Group>>('/groups/mine', { limit: 100 }) })

export const useGroup = (id: string) =>
  useQuery({ queryKey: [...groupsKey, 'detail', id], queryFn: () => api.get<Group>(`/groups/${id}`), retry: false })

/** Every group mutation refreshes all group lists and details. */
const useGroupMutation = <V, R = unknown>(fn: (v: V) => Promise<R>) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: groupsKey }) })
}

export const useCreateGroup = () => useGroupMutation((b: Schemas['GroupCreate']) => api.post<Group>('/groups', b))
export const useUpdateGroup = (id: string) => useGroupMutation((b: Schemas['GroupUpdate']) => api.patch<Group>(`/groups/${id}`, b))
export const useDeleteGroup = () => useGroupMutation((id: string) => api.del(`/groups/${id}`))
export const useJoinGroup = () => useGroupMutation((id: string) => api.post(`/groups/${id}/join`))
export const useLeaveGroup = () => useGroupMutation((id: string) => api.post(`/groups/${id}/leave`))
