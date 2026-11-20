import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'

export type Member = Schemas['MemberOut']
const key = (groupId: string) => ['members', groupId] as const

export const useMembers = (groupId: string) =>
  useQuery({ queryKey: key(groupId), queryFn: () => api.get<Page<Member>>(`/groups/${groupId}/members`, { limit: 100 }) })

const useMemberMutation = <V>(groupId: string, fn: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: key(groupId) }), qc.invalidateQueries({ queryKey: ['groups'] }), qc.invalidateQueries({ queryKey: ['progress', groupId] })]),
  })
}

export const useSetMemberRole = (groupId: string) =>
  useMemberMutation(groupId, ({ userId, role }: { userId: string; role: Member['role'] }) => api.patch(`/groups/${groupId}/members/${userId}`, { role }))

export const useRemoveMember = (groupId: string) =>
  useMemberMutation(groupId, (userId: string) => api.del(`/groups/${groupId}/members/${userId}`))
