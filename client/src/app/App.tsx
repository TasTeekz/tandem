import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NotFoundPage } from '@/pages/not-found'
import { IS_DEV } from '@/shared/config'
import { ToastProvider } from '@/shared/ui'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
const KitPage = IS_DEV ? lazy(() => import('@/pages/kit').then((m) => ({ default: m.KitPage }))) : null

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              {KitPage && <Route path="/_kit" element={<KitPage />} />}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
