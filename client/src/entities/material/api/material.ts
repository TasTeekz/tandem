import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Page, Schemas } from '@/shared/api'

export type Material = Schemas['MaterialOut']
export const materialsKey = (groupId: string) => ['materials', groupId] as const

export const useMaterials = (groupId: string) =>
  useQuery({ queryKey: materialsKey(groupId), queryFn: () => api.get<Page<Material>>(`/groups/${groupId}/materials`, { limit: 100 }) })

export function useUploadMaterial(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.upload<Material>(`/groups/${groupId}/materials`, form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: materialsKey(groupId) }),
  })
}

export function useDeleteMaterial(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/materials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: materialsKey(groupId) }),
  })
}

export const downloadMaterial = (m: Material) => api.download(`/materials/${m.id}/download`, m.file_name)
