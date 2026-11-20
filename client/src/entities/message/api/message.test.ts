import { mergeMessages } from './message'
import type { Message } from './message'

const m = (id: string, created_at: string): Message => ({ id, created_at, group_id: 'g', author_id: 'a', author_name: 'A', body: id })

describe('mergeMessages', () => {
  it('orders by created_at then id and drops duplicates', () => {
    const prev = [m('b', '2026-01-01T10:00:02Z')]
    const sent = m('c', '2026-01-01T10:00:03Z')
    const slowPoll = [m('a', '2026-01-01T10:00:01Z'), m('b', '2026-01-01T10:00:02Z'), m('d', '2026-01-01T10:00:03Z')]
    const out = mergeMessages(mergeMessages(prev, [sent]), slowPoll)
    expect(out.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
