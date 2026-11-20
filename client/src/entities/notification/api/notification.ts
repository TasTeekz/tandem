import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'

export type Notification = Schemas['NotificationOut']
const key = ['notifications'] as const

export const useNotifications = (page: number, pageSize: number) =>
  useQuery({
    queryKey: [...key, 'list', page, pageSize],
    queryFn: () => api.get<Page<Notification>>('/notifications', { limit: pageSize, offset: (page - 1) * pageSize }),
    placeholderData: keepPreviousData,
  })

export const useUnreadCount = () =>
  useQuery({ queryKey: [...key, 'unread'], queryFn: () => api.get<Schemas['UnreadCountOut']>('/notifications/unread-count'), refetchInterval: 30_000, select: (d) => d.count })

const useNotificationMutation = <V>(fn: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: key }) })
}

export const useMarkRead = () => useNotificationMutation((id: string) => api.post(`/notifications/${id}/read`))
export const useMarkAllRead = () => useNotificationMutation(() => api.post('/notifications/read-all'))
