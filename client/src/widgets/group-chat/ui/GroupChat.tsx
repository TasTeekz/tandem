import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PAGE_SIZE, useLoadEarlier, useMessages, MessageBubble } from '@/entities/message'
import { MessageComposer } from '@/features/message-send'
import { errorMessage } from '@/shared/api'
import { Button, EmptyState, Skeleton } from '@/shared/ui'
import './group-chat.css'

export function GroupChat({ groupId, meId }: { groupId: string; meId: string }) {
  const { t } = useTranslation()
  const { data, isPending, isError, error, refetch } = useMessages(groupId)
  const list = useRef<HTMLUListElement>(null)
  const count = data?.length ?? 0
  const earlier = useLoadEarlier(groupId)
  const [exhausted, setExhausted] = useState(false)
  const loadEarlier = () => {
    const el = list.current
    const before = el?.scrollHeight ?? 0
    earlier.mutate(undefined, {
      onSuccess: (n) => {
        if (n < PAGE_SIZE) setExhausted(true)
        // Keep the reader on the same message after older ones are prepended.
        requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - before })
      },
    })
  }

  // Follow new messages only while the reader is already near the bottom.
  useEffect(() => {
    const el = list.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight
  }, [count])
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight }, [isPending])

  return (
    <section className="chat" aria-label={t('group.tabs.chat')}>
      {isPending ? (
        <div className="chat__list" aria-busy="true">
          {[60, 40, 70].map((w, i) => <Skeleton key={i} width={`${w}%`} height={44} />)}
        </div>
      ) : isError ? (
        <div className="chat__list"><EmptyState icon="alert" title={t('errors.loadFailed')} text={errorMessage(error)} action={<Button variant="secondary" onClick={() => void refetch()}>{t('common.retry')}</Button>} /></div>
      ) : count === 0 ? (
        <div className="chat__list"><EmptyState icon="chat" title={t('chat.emptyTitle')} text={t('chat.emptyText')} /></div>
      ) : (
        <ul className="chat__list" ref={list} aria-live="polite" aria-relevant="additions">
          {!exhausted && count >= PAGE_SIZE && (
            <li className="chat__earlier"><Button variant="ghost" size="sm" loading={earlier.isPending} onClick={loadEarlier}>{t('chat.loadEarlier')}</Button></li>
          )}
          {data.map((m) => <MessageBubble key={m.id} message={m} mine={m.author_id === meId} />)}
        </ul>
      )}
      <MessageComposer groupId={groupId} />
    </section>
  )
}
