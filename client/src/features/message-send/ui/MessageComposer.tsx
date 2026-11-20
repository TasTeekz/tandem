import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendMessage } from '@/entities/message'
import { errorMessage } from '@/shared/api'
import { Icon, useToast } from '@/shared/ui'
import './message-composer.css'

export function MessageComposer({ groupId }: { groupId: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const send = useSendMessage(groupId)
  const [body, setBody] = useState('')

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const text = body.trim()
    if (!text || send.isPending) return
    send.mutate(text, { onSuccess: () => setBody(''), onError: (err) => toast(errorMessage(err), 'error') })
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <label className="t-sr" htmlFor="composer-input">{t('chat.placeholder')}</label>
      <textarea id="composer-input" className="composer__input" rows={1} maxLength={4000} placeholder={t('chat.placeholder')} value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={onKey} />
      <button type="submit" className="composer__send" aria-label={t('chat.send')} title={t('chat.send')} disabled={!body.trim() || send.isPending}>
        <Icon name="send" size={20} />
      </button>
    </form>
  )
}
