import { api } from './client'
import { getTokens, setTokens } from './session'

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const authOf = (call: unknown[]) => (call[1] as RequestInit).headers as Record<string, string>

afterEach(() => { vi.unstubAllGlobals(); setTokens(null) })

describe('api refresh', () => {
  it('retries once with the newer token when another request already refreshed', async () => {
    setTokens({ access: 'old', refresh: 'r' })
    const fetchMock = vi.fn().mockImplementationOnce(async () => {
      setTokens({ access: 'new', refresh: 'r2' }) // refresh finished while this request was in flight
      return json(401, { error: { code: 'not_authenticated', message: 'x' } })
    }).mockResolvedValueOnce(json(200, { ok: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(api.get('/x')).resolves.toEqual({ ok: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(authOf(fetchMock.mock.calls[1]!).Authorization).toBe('Bearer new')
  })

  it('keeps tokens when the refresh call fails on the network', async () => {
    setTokens({ access: 'old', refresh: 'r' })
    const fetchMock = vi.fn().mockResolvedValueOnce(json(401, { error: { code: 'not_authenticated', message: 'x' } })).mockRejectedValueOnce(new TypeError('offline'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(api.get('/x')).rejects.toMatchObject({ status: 401 })
    expect(getTokens()).not.toBeNull()
  })

  it('clears tokens only when refresh answers 401', async () => {
    setTokens({ access: 'old', refresh: 'r' })
    const fetchMock = vi.fn().mockResolvedValue(json(401, { error: { code: 'invalid_refresh_token', message: 'x' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(api.get('/x')).rejects.toMatchObject({ status: 401 })
    expect(getTokens()).toBeNull()
  })
})
