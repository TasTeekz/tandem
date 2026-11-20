import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AdminGroupFormModal, AdminMaterialFormModal, UserFormModal, useAdminGroups, useAdminMaterials, useAdminUsers,
  useDeleteAdminGroup, useDeleteAdminMaterial, useDeleteUser,
} from '@/features/admin-crud'
import type { AdminGroup, AdminMaterial, AdminUser } from '@/features/admin-crud'
import { errorMessage } from '@/shared/api'
import { formatBytes, formatDate, useDebounced } from '@/shared/lib'
import { Badge, ConfirmDialog, IconButton, useToast } from '@/shared/ui'
import type { Column } from '@/shared/ui'
import { AdminSection } from './AdminSection'

type Form<T> = { row?: T } | null

/** q/page state for one tab; typing resets to page 1 and the query is debounced. */
function useTableState() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(q.trim())
  return { q, debounced, page, setPage, setQ: (v: string) => { setQ(v); setPage(1) } }
}

function RowActions({ onEdit, onDelete, disableDelete }: { onEdit: () => void; onDelete: () => void; disableDelete?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className="admin-actions">
      <IconButton icon="edit" size="sm" label={t('common.edit')} onClick={onEdit} />
      <IconButton icon="trash" size="sm" label={t('common.delete')} disabled={disableDelete} onClick={onDelete} />
    </span>
  )
}

export function AdminUsersTable({ meId }: { meId: string }) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const s = useTableState()
  const query = useAdminUsers({ q: s.debounced, page: s.page })
  const remove = useDeleteUser()
  const [form, setForm] = useState<Form<AdminUser>>(null)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const columns: Column<AdminUser>[] = [
    { key: 'name', header: t('auth.fullName'), render: (u) => <span className="admin-cell-main">{u.full_name}</span> },
    { key: 'email', header: t('auth.email'), render: (u) => u.email },
    { key: 'role', header: t('admin.users.role'), render: (u) => <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{t(`roles.${u.role}`)}</Badge> },
    { key: 'active', header: t('admin.users.status'), render: (u) => <Badge tone={u.is_active ? 'success' : 'danger'}>{t(u.is_active ? 'admin.users.activeBadge' : 'admin.users.disabledBadge')}</Badge> },
    { key: 'created', header: t('admin.created'), render: (u) => formatDate(u.created_at, i18n.language) },
    { key: 'actions', header: t('common.actions'), numeric: true, render: (u) => <RowActions onEdit={() => setForm({ row: u })} onDelete={() => setTarget(u)} disableDelete={u.id === meId} /> },
  ]
  const confirm = () => target && remove.mutate(target.id, { onSuccess: () => toast(t('admin.deleted'), 'success'), onError: (e) => toast(errorMessage(e), 'error'), onSettled: () => setTarget(null) })
  return (
    <>
      <AdminSection caption={t('admin.tabs.users')} columns={columns} rowKey={(u) => u.id} data={query.data} isPending={query.isPending} error={query.error} onRetry={() => void query.refetch()}
        q={s.q} onQuery={s.setQ} page={s.page} onPage={s.setPage} onCreate={() => setForm({})} createLabel={t('admin.users.create')} />
      <UserFormModal open={!!form} onClose={() => setForm(null)} user={form?.row} isSelf={form?.row?.id === meId} />
      <ConfirmDialog open={!!target} title={t('admin.deleteTitle')} text={t('admin.users.deleteConfirm', { name: target?.full_name ?? '' })} loading={remove.isPending} onConfirm={confirm} onClose={() => setTarget(null)} />
    </>
  )
}

export function AdminGroupsTable() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const s = useTableState()
  const query = useAdminGroups({ q: s.debounced, page: s.page })
  const remove = useDeleteAdminGroup()
  const [form, setForm] = useState<Form<AdminGroup>>(null)
  const [target, setTarget] = useState<AdminGroup | null>(null)
  const columns: Column<AdminGroup>[] = [
    { key: 'title', header: t('group.title'), render: (g) => <span className="admin-cell-main">{g.title}</span> },
    { key: 'subject', header: t('group.subject'), render: (g) => g.subject ?? '—' },
    { key: 'vis', header: t('admin.groups.visibility'), render: (g) => <Badge tone={g.is_public ? 'neutral' : 'primary'}>{t(g.is_public ? 'group.public' : 'group.private')}</Badge> },
    { key: 'members', header: t('admin.groups.membersCol'), numeric: true, render: (g) => g.members_count },
    { key: 'created', header: t('admin.created'), render: (g) => formatDate(g.created_at, i18n.language) },
    { key: 'actions', header: t('common.actions'), numeric: true, render: (g) => <RowActions onEdit={() => setForm({ row: g })} onDelete={() => setTarget(g)} /> },
  ]
  const confirm = () => target && remove.mutate(target.id, { onSuccess: () => toast(t('admin.deleted'), 'success'), onError: (e) => toast(errorMessage(e), 'error'), onSettled: () => setTarget(null) })
  return (
    <>
      <AdminSection caption={t('admin.tabs.groups')} columns={columns} rowKey={(g) => g.id} data={query.data} isPending={query.isPending} error={query.error} onRetry={() => void query.refetch()}
        q={s.q} onQuery={s.setQ} page={s.page} onPage={s.setPage} onCreate={() => setForm({})} createLabel={t('admin.groups.create')} />
      <AdminGroupFormModal open={!!form} onClose={() => setForm(null)} group={form?.row} />
      <ConfirmDialog open={!!target} title={t('admin.deleteTitle')} text={t('admin.groups.deleteConfirm', { title: target?.title ?? '' })} loading={remove.isPending} onConfirm={confirm} onClose={() => setTarget(null)} />
    </>
  )
}

export function AdminMaterialsTable() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const s = useTableState()
  const query = useAdminMaterials({ q: s.debounced, page: s.page })
  const remove = useDeleteAdminMaterial()
  const [form, setForm] = useState<Form<AdminMaterial>>(null)
  const [target, setTarget] = useState<AdminMaterial | null>(null)
  const columns: Column<AdminMaterial>[] = [
    { key: 'title', header: t('materials.title'), render: (m) => <span className="admin-cell-main">{m.title}</span> },
    { key: 'file', header: t('admin.materials.file'), render: (m) => m.file_name },
    { key: 'size', header: t('admin.materials.size'), numeric: true, render: (m) => formatBytes(m.size_bytes) },
    { key: 'by', header: t('admin.materials.uploader'), render: (m) => m.uploader_name },
    { key: 'created', header: t('admin.created'), render: (m) => formatDate(m.created_at, i18n.language) },
    { key: 'actions', header: t('common.actions'), numeric: true, render: (m) => <RowActions onEdit={() => setForm({ row: m })} onDelete={() => setTarget(m)} /> },
  ]
  const confirm = () => target && remove.mutate(target.id, { onSuccess: () => toast(t('admin.deleted'), 'success'), onError: (e) => toast(errorMessage(e), 'error'), onSettled: () => setTarget(null) })
  return (
    <>
      <AdminSection caption={t('admin.tabs.materials')} columns={columns} rowKey={(m) => m.id} data={query.data} isPending={query.isPending} error={query.error} onRetry={() => void query.refetch()}
        q={s.q} onQuery={s.setQ} page={s.page} onPage={s.setPage} onCreate={() => setForm({})} createLabel={t('admin.materials.create')} />
      <AdminMaterialFormModal open={!!form} onClose={() => setForm(null)} material={form?.row} />
      <ConfirmDialog open={!!target} title={t('admin.deleteTitle')} text={t('admin.materials.deleteConfirm', { title: target?.title ?? '' })} loading={remove.isPending} onConfirm={confirm} onClose={() => setTarget(null)} />
    </>
  )
}
