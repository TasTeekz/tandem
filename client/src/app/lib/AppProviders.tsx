import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { ApiError, useHasTokens } from '@/shared/api'
import { ToastProvider } from '@/shared/ui'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
})

/** Keeps <html lang> in sync and drops every cached user-scoped query when the session ends (logout or failed refresh). */
function SessionBoundary({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const hasTokens = useHasTokens()
  useEffect(() => { document.documentElement.lang = i18n.language }, [i18n.language])
  useEffect(() => { if (!hasTokens) queryClient.clear() }, [hasTokens])
  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <SessionBoundary>{children}</SessionBoundary>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
