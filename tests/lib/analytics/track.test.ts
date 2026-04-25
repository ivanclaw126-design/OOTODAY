import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackEvent } from '@/lib/analytics/track'

describe('trackEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('swallows analytics failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    await expect(
      trackEvent({
        eventName: 'today_viewed',
        module: 'today',
        route: '/today'
      })
    ).resolves.toBeUndefined()
  })

  it('posts analytics payloads with keepalive', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetch)

    await trackEvent({
      eventName: 'shop_viewed',
      module: 'shop',
      route: '/shop',
      properties: {
        itemCount: 4
      }
    })

    expect(fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
      method: 'POST',
      keepalive: true,
      body: expect.stringContaining('"eventName":"shop_viewed"')
    }))
  })
})
