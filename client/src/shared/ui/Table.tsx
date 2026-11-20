import type { ReactNode } from 'react'

export type Column<T> = { key: string; header: string; render: (row: T) => ReactNode; numeric?: boolean }
type TableProps<T> = { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; caption: string }

export function Table<T>({ columns, rows, rowKey, caption }: TableProps<T>) {
  return (
    <div className="t-table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="t-table">
        <caption className="t-sr">{caption}</caption>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric ? 't-num t-table__r' : undefined}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key} className={c.numeric ? 't-num t-table__r' : undefined}>{c.render(r)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
