import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDeleteGroup, useGroup } from '@/entities/group'
import { useSession } from '@/entities/user'
import { GroupFormModal } from '@/features/group-create'
import { JoinButton, LeaveButton } from '@/features/group-join-leave'
import { ApiError, errorMessage } from '@/shared/api'
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, Skeleton, Tabs, useToast } from '@/shared/ui'
import { GoalsBoard } from '@/widgets/goals-board'
import { GroupChat } from '@/widgets/group-chat'
import { MaterialsPanel } from '@/widgets/materials-panel'
import { MembersList } from '@/widgets/members-list'
import { ProgressBoard } from '@/widgets/progress-board'

const TABS = ['chat', 'materials', 'goals', 'members'] as const
type Tab = (typeof TABS)[number]
const isTab = (v: string | null): v is Tab => TABS.some((x) => x === v)

export function GroupPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { status, user, isAdmin } = useSession()
  const { data: group, isPending, error, refetch } = useGroup(id)
  const remove = useDeleteGroup()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (isPending) return <div className="page stack" aria-busy="true"><Skeleton height={48} width="50%" /><Skeleton height={320} /></div>
  if (error || !group) {
    const missing = error instanceof ApiError && (error.code === 'not_found' || error.code === 'forbidden')
    return (
      <div className="page">
        <EmptyState icon={missing ? 'search' : 'alert'} title={t(missing ? 'group.notFoundTitle' : 'errors.loadFailed')} text={errorMessage(error)}
          action={missing ? <Link to="/groups">{t('group.backToGroups')}</Link> : <Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      </div>
    )
  }

  const authed = status === 'authed' && !!user
  const isMember = group.my_role !== null || isAdmin
  const canManage = group.my_role === 'mentor' || isAdmin
  const canDelete = isAdmin || (!!user && group.owner_id === user.id)
  const requested = params.get('tab')
  const tab: Tab = isTab(requested) ? requested : 'chat'

  const confirmDelete = () =>
    remove.mutate(group.id, {
      onSuccess: () => { toast(t('group.deleted'), 'success'); navigate('/groups', { replace: true }) },
      onError: (e) => { toast(errorMessage(e), 'error'); setDeleting(false) },
    })

  const actions = (
    <>
      {authed && group.my_role === null && <JoinButton groupId={group.id} size="md" />}
      {authed && group.my_role !== null && <LeaveButton groupId={group.id} onLeft={() => navigate('/groups')} />}
      {canManage && <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>}
      {canDelete && <Button variant="danger" icon="trash" onClick={() => setDeleting(true)}>{t('common.delete')}</Button>}
    </>
  )

  return (
    <div className="page">
      <PageHeader title={group.title} subtitle={group.description ?? undefined} actions={actions} />
      <div className="meta-row">
        {group.subject && <Badge tone="accent">{group.subject}</Badge>}
        <Badge tone={group.is_public ? 'neutral' : 'primary'}>{t(group.is_public ? 'group.public' : 'group.private')}</Badge>
        <Badge>{t('group.members', { n: group.members_count })}</Badge>
        {group.my_role && <Badge tone="success">{t(`roles.${group.my_role}`)}</Badge>}
      </div>

      {isMember && user ? (
        <Tabs label={t('group.tabsLabel')} value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })}
          items={[
            { id: 'chat', label: t('group.tabs.chat'), content: <GroupChat groupId={group.id} meId={user.id} /> },
            { id: 'materials', label: t('group.tabs.materials'), content: <MaterialsPanel groupId={group.id} meId={user.id} canManage={canManage} /> },
            { id: 'goals', label: t('group.tabs.goals'), content: <div className="stack-lg"><GoalsBoard groupId={group.id} canManage={canManage} /><ProgressBoard groupId={group.id} meId={user.id} /></div> },
            { id: 'members', label: t('group.tabs.members'), content: <MembersList groupId={group.id} meId={user.id} canManage={canManage} /> },
          ]} />
      ) : (
        <Card>
          <EmptyState icon="users" title={t(authed ? 'group.joinToSeeTitle' : 'group.loginToSeeTitle')} text={t(authed ? 'group.joinToSeeText' : 'group.loginToSeeText')}
            action={authed ? <JoinButton groupId={group.id} size="md" /> : <Link to={`/login?next=${encodeURIComponent(`/groups/${group.id}`)}`} className="t-btn t-btn--primary">{t('auth.login')}</Link>} />
        </Card>
      )}

      <GroupFormModal open={editing} onClose={() => setEditing(false)} group={group} />
      <ConfirmDialog open={deleting} title={t('group.deleteTitle')} text={t('group.deleteConfirm', { title: group.title })} loading={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(false)} />
    </div>
  )
}
