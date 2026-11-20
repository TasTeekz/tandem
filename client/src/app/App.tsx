import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { IS_DEV } from '@/shared/config'
import { GuestOnly, PageLoader, RequireAdmin, RequireAuth } from './guards/guards'
import { AppLayout } from './layout/AppLayout'
import { AppProviders } from './lib/AppProviders'

const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const HomePage = page(() => import('@/pages/home'), 'HomePage')
const LoginPage = page(() => import('@/pages/login'), 'LoginPage')
const RegisterPage = page(() => import('@/pages/register'), 'RegisterPage')
const GroupsPage = page(() => import('@/pages/groups'), 'GroupsPage')
const GroupPage = page(() => import('@/pages/group'), 'GroupPage')
const SearchPage = page(() => import('@/pages/search'), 'SearchPage')
const NotificationsPage = page(() => import('@/pages/notifications'), 'NotificationsPage')
const ProfilePage = page(() => import('@/pages/profile'), 'ProfilePage')
const AdminPage = page(() => import('@/pages/admin'), 'AdminPage')
const NotFoundPage = page(() => import('@/pages/not-found'), 'NotFoundPage')
const KitPage = IS_DEV ? page(() => import('@/pages/kit'), 'KitPage') : null

export function App() {
  return (
    <AppProviders>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {KitPage && <Route path="/_kit" element={<KitPage />} />}
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="groups/:id" element={<GroupPage />} />
            <Route element={<GuestOnly />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="groups" element={<GroupsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route element={<RequireAdmin />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AppProviders>
  )
}
