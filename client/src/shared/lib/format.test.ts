import { formatDate } from './format'

describe('formatDate', () => {
  it('keeps a date-only value on its calendar day (tests run in America/Los_Angeles)', () => {
    expect(formatDate('2027-01-01', 'en')).toBe('Jan 1, 2027')
  })
})
