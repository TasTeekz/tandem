import { useTranslation } from 'react-i18next'
import { formatTime } from '@/shared/lib'
import { Avatar } from '@/shared/ui'
import type { Message } from '../api/message'
import './message-bubble.css'

export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  const { i18n } = useTranslation()
  return (
    <li className={mine ? 'msg msg--mine' : 'msg'}>
      {!mine && <Avatar name={message.author_name} size={32} />}
      <div className="msg__bubble">
        {!mine && <span className="msg__author">{message.author_name}</span>}
        <p className="msg__body">{message.body}</p>
        <time className="msg__time t-num" dateTime={message.created_at}>{formatTime(message.created_at, i18n.language)}</time>
      </div>
    </li>
  )
}
