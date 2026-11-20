import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <main style={{ maxWidth: 560, margin: '12vh auto', padding: '0 16px' }}>
      <EmptyState icon="search" title="Page not found" text="The page you opened does not exist or was moved." action={<Link to="/">Go to start</Link>} />
    </main>
  )
}
