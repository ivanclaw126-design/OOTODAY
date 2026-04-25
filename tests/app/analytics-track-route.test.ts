import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const insert = vi.fn()
const from = vi.fn(() => ({ insert }))
const createSupabaseServerClient = vi.fn(async () => ({ from }))

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

describe('analytics track route', () => {
  beforeEach(() => {
    getSession.mockReset()
    insert.mockReset()
    from.mockClear()
    createSupabaseServerClient.mockClear()
  })

  it('inserts valid analytics events for signed-in users', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    insert.mockResolvedValue({ error: null })

    const { POST } = await import('@/app/api/analytics/track/route')
    const response = await POST(new Request('https://ootoday.test/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        referer: 'https://ootoday.test/today',
        'user-agent': 'vitest'
      },
      body: JSON.stringify({
        eventName: 'today_viewed',
        module: 'today',
        route: '/today',
        properties: { itemCount: 3 }
      })
    }))

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(from).toHaveBeenCalledWith('analytics_events')
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      event_name: 'today_viewed',
      module: 'today',
      route: '/today',
      properties: { itemCount: 3 },
      referrer: 'https://ootoday.test/today',
      user_agent: 'vitest'
    }))
  })

  it('does not insert events for signed-out users', async () => {
    getSession.mockResolvedValue(null)

    const { POST } = await import('@/app/api/analytics/track/route')
    const response = await POST(new Request('https://ootoday.test/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'today_viewed',
        module: 'today'
      })
    }))

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(insert).not.toHaveBeenCalled()
  })

  it('accepts invalid payloads without blocking the frontend', async () => {
    const { POST } = await import('@/app/api/analytics/track/route')
    const response = await POST(new Request('https://ootoday.test/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'unknown',
        module: 'today'
      })
    }))

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(getSession).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })
})
