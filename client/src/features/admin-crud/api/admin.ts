import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'

export const ADMIN_PAGE_SIZE = 10
export type AdminUser = Schemas['UserOut']
export type AdminGroup = Schemas['GroupOut']
export type AdminMaterial = Schemas['MaterialOut']
type ListParams = { q: string; page: number; pageSize?: number }

const key = ['admin'] as const

export const useAdminStats = () => useQuery({ queryKey: [...key, 'stats'], queryFn: () => api.get<Schemas['StatsOut']>('/admin/stats') })

const useAdminList = <T>(kind: 'users' | 'groups' | 'materials', { q, page, pageSize = ADMIN_PAGE_SIZE }: ListParams) =>
  useQuery({
    queryKey: [...key, kind, q, page, pageSize],
    queryFn: () => api.get<Page<T>>(`/admin/${kind}`, { q, limit: pageSize, offset: (page - 1) * pageSize }),
    placeholderData: keepPreviousData,
  })

export const useAdminUsers = (p: ListParams) => useAdminList<AdminUser>('users', p)
export const useAdminGroups = (p: ListParams) => useAdminList<AdminGroup>('groups', p)
export const useAdminMaterials = (p: ListParams) => useAdminList<AdminMaterial>('materials', p)

/** Every admin write refreshes all admin tables, stats and the public group caches. */
const useAdminMutation = <V>(fn: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: key }), qc.invalidateQueries({ queryKey: ['groups'] }), qc.invalidateQueries({ queryKey: ['materials'] })]),
  })
}

export const useCreateUser = () => useAdminMutation((b: Schemas['AdminUserCreate']) => api.post('/admin/users', b))
export const useUpdateUser = () => useAdminMutation(({ id, ...b }: Schemas['AdminUserUpdate'] & { id: string }) => api.patch(`/admin/users/${id}`, b))
export const useDeleteUser = () => useAdminMutation((id: string) => api.del(`/admin/users/${id}`))

export const useCreateAdminGroup = () => useAdminMutation((b: Schemas['AdminGroupCreate']) => api.post('/admin/groups', b))
export const useUpdateAdminGroup = () => useAdminMutation(({ id, ...b }: Schemas['AdminGroupUpdate'] & { id: string }) => api.patch(`/admin/groups/${id}`, b))
export const useDeleteAdminGroup = () => useAdminMutation((id: string) => api.del(`/admin/groups/${id}`))

export const useCreateAdminMaterial = () =>
  useAdminMutation(({ groupId, file, title }: { groupId: string; file: File; title: string }) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    return api.upload(`/groups/${groupId}/materials`, form)
  })
export const useUpdateAdminMaterial = () => useAdminMutation(({ id, title }: { id: string; title: string }) => api.patch(`/admin/materials/${id}`, { title }))
export const useDeleteAdminMaterial = () => useAdminMutation((id: string) => api.del(`/admin/materials/${id}`))
