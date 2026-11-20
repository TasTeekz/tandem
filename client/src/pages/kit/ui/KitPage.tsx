import { useState } from 'react'
import { Logo } from '@/shared/assets'
import { LOCALES, setLocale } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { useTheme } from '@/shared/lib'
import {
  Avatar, Badge, Button, Card, Checkbox, EmptyState, FileDropzone, Icon, IconButton, iconNames, Input, Menu, Modal,
  PageHeader, Pagination, ProgressBar, ProgressRing, Select, Skeleton, Spinner, Switch, Table, Tabs, Textarea, Tooltip, useToast,
} from '@/shared/ui'
import './kit.css'

type Row = { name: string; role: string; done: number }
const rows: Row[] = [
  { name: 'Aigerim Nurlan', role: 'mentor', done: 82 },
  { name: 'Timur Bekov', role: 'member', done: 45 },
  { name: 'Dana Sarsen', role: 'member', done: 100 },
]

function Showcase({ theme }: { theme: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('chat')
  const [page, setPage] = useState(2)
  const [on, setOn] = useState(true)
  const toast = useToast()
  return (
    <section className="kit-scope" data-theme={theme} aria-label={`${theme} theme`}>
      <h2>{theme} theme</h2>
      <Logo size={36} />
      <PageHeader title="Algorithms study circle" subtitle="Weekly problem sets, shared notes and who is on track." actions={<Button icon="plus">New goal</Button>} />

      <div className="kit-sec">
        <h3>Buttons</h3>
        <div className="kit-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" icon="check">Large</Button>
        </div>
        <div className="kit-row">
          <Tooltip text="Notifications"><IconButton icon="bell" label="Notifications" /></Tooltip>
          <IconButton icon="edit" label="Edit" variant="secondary" />
          <IconButton icon="trash" label="Delete" variant="danger" size="sm" />
          <Spinner label="Loading" />
        </div>
      </div>

      <div className="kit-sec">
        <h3>Fields</h3>
        <div className="kit-cols">
          <Input label="Email" type="email" placeholder="you@university.edu" leading={<Icon name="user" size={18} />} hint="We never share it." />
          <Input label="Password" type="password" defaultValue="short" error="Use at least 8 characters." />
          <Select label="Language" defaultValue="en">
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="kk">Қазақша</option>
          </Select>
          <Textarea label="About you" placeholder="What are you studying?" />
        </div>
        <div className="kit-row">
          <Checkbox label="Public group" defaultChecked />
          <Checkbox label="Mentors only" />
          <Switch label="Notify me" checked={on} onChange={(e) => setOn(e.target.checked)} />
        </div>
      </div>

      <div className="kit-sec">
        <h3>Cards, badges, avatars</h3>
        <div className="kit-cols">
          <Card interactive>
            <div className="kit-row" style={{ justifyContent: 'space-between' }}>
              <Badge tone="primary">Public</Badge>
              <Badge tone="accent">Mentor</Badge>
            </div>
            <h3 style={{ marginTop: 12 }}>Calculus II</h3>
            <p style={{ color: 'var(--c-muted)', margin: '4px 0 16px' }}>12 members, 3 open goals</p>
            <ProgressBar value={64} label="Group progress" />
          </Card>
          <Card>
            <div className="kit-row">
              <Avatar name="Aigerim Nurlan" />
              <Avatar name="Timur Bekov" />
              <Avatar name="Dana" size={48} />
              <ProgressRing value={72} label="Weekly goal" />
            </div>
            <div className="kit-row" style={{ marginTop: 12 }}>
              <Badge>Neutral</Badge>
              <Badge tone="success">Done</Badge>
              <Badge tone="danger">Overdue</Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="kit-sec">
        <h3>Tabs</h3>
        <Tabs
          label="Group sections"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'chat', label: 'Chat', content: <p>Messages appear here.</p> },
            { id: 'materials', label: 'Materials', content: <p>Shared files appear here.</p> },
            { id: 'goals', label: 'Goals', content: <p>Goals and progress appear here.</p> },
          ]}
        />
      </div>

      <div className="kit-sec">
        <h3>Table and pagination</h3>
        <Table
          caption="Members"
          rowKey={(r) => r.name}
          rows={rows}
          columns={[
            { key: 'n', header: 'Member', render: (r) => <span className="kit-row" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar name={r.name} size={28} />{r.name}</span> },
            { key: 'r', header: 'Role', render: (r) => <Badge tone={r.role === 'mentor' ? 'accent' : 'neutral'}>{r.role}</Badge> },
            { key: 'p', header: 'Progress', numeric: true, render: (r) => `${r.done}%` },
          ]}
        />
        <Pagination page={page} total={5} onChange={setPage} />
      </div>

      <div className="kit-sec">
        <h3>Feedback</h3>
        <div className="kit-row">
          <Button variant="secondary" onClick={() => toast('Goal saved', 'success')}>Success toast</Button>
          <Button variant="secondary" onClick={() => toast('Could not upload the file', 'error')}>Error toast</Button>
          <Button variant="secondary" onClick={() => setOpen(true)}>Open modal</Button>
          <Menu
            label="Group actions"
            trigger={<span className="t-btn t-btn--secondary t-btn--md">Actions<Icon name="chevronDown" size={16} /></span>}
            items={[
              { id: 'e', label: 'Edit group', icon: 'edit', onSelect: () => toast('Edit group') },
              { id: 'l', label: 'Leave group', icon: 'logout', danger: true, onSelect: () => toast('Left group') },
            ]}
          />
        </div>
        <div className="kit-row">
          <Skeleton width={44} height={44} round />
          <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 160 }}>
            <Skeleton width="60%" />
            <Skeleton width="90%" />
          </div>
        </div>
        <FileDropzone onFile={(f) => toast(`Selected ${f.name}`, 'success')} />
        <EmptyState icon="chat" title="No messages yet" text="Say hello to your group and start the conversation." action={<Button size="sm">Write a message</Button>} />
      </div>

      <div className="kit-sec">
        <h3>Icons</h3>
        <div className="kit-icons">{iconNames.map((n) => <span key={n} title={n}><Icon name={n} /></span>)}</div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Leave this group?"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => setOpen(false)}>Leave group</Button></>}
      >
        <p>You will lose access to chat, materials and goals. You can join again if the group is public.</p>
      </Modal>
    </section>
  )
}

export function KitPage() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <div className="kit-bar">
        <Logo />
        <div className="kit-bar__tools">
          <Select label="Locale" defaultValue="en" onChange={(e) => setLocale(e.target.value as Locale)}>
            {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
          <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label="Toggle app theme" variant="secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </div>
      <main className="kit-grid">
        <Showcase theme="light" />
        <Showcase theme="dark" />
      </main>
    </>
  )
}
