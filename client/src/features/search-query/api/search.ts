import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Schemas } from '@/shared/api'

export type SearchResults = Schemas['SearchOut']

export const useSearch = (q: string) =>
  useQuery({ queryKey: ['search', q], queryFn: () => api.get<SearchResults>('/search', { q, limit: 8 }), enabled: q.length > 0, retry: false })
