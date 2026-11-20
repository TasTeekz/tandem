import type { ReactNode } from 'react'

type PageHeaderProps = { title: string; subtitle?: string; actions?: ReactNode }
export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header className="t-pagehead">
    <div>
      <h1>{title}</h1>
      {subtitle && <p className="t-pagehead__sub">{subtitle}</p>}
    </div>
    {actions && <div className="t-pagehead__actions">{actions}</div>}
  </header>
)
