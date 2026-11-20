import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'

export type Goal = Schemas['GoalOut']
export type ProgressBoard = Schemas['ProgressBoardOut']
const goalsKey = (groupId: string) => ['goals', groupId] as const
const boardKey = (groupId: string) => ['progress', groupId] as const

export const useGoals = (groupId: string) =>
  useQuery({ queryKey: goalsKey(groupId), queryFn: () => api.get<Page<Goal>>(`/groups/${groupId}/goals`, { limit: 100 }) })

export const useProgressBoard = (groupId: string) =>
  useQuery({ queryKey: boardKey(groupId), queryFn: () => api.get<ProgressBoard>(`/groups/${groupId}/progress`) })

const useGoalMutation = <V>(groupId: string, fn: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: goalsKey(groupId) }), qc.invalidateQueries({ queryKey: boardKey(groupId) })]),
  })
}

export const useCreateGoal = (groupId: string) => useGoalMutation(groupId, (b: Schemas['GoalCreate']) => api.post(`/groups/${groupId}/goals`, b))
export const useUpdateGoal = (groupId: string) => useGoalMutation(groupId, ({ id, ...b }: Schemas['GoalUpdate'] & { id: string }) => api.patch(`/goals/${id}`, b))
export const useDeleteGoal = (groupId: string) => useGoalMutation(groupId, (id: string) => api.del(`/goals/${id}`))
export const useSetProgress = (groupId: string) => useGoalMutation(groupId, ({ id, percent }: { id: string; percent: number }) => api.put(`/goals/${id}/progress`, { percent }))
