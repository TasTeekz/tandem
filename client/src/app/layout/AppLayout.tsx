import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/widgets/header'
import { PageLoader } from '../guards/guards'

export function AppLayout() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
      </main>
    </>
  )
}
