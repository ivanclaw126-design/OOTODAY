import { describe, expect, it } from 'vitest'
import { normalizeAnalyticsTrackInput, sourceDomainFromUrl } from '@/lib/analytics/events'

describe('analytics event payload validation', () => {
  it('normalizes a valid analytics payload', () => {
    expect(
      normalizeAnalyticsTrackInput({
        eventName: 'today_viewed',
        module: 'today',
        route: '/today',
        properties: {
          itemCount: 3,
          ignored: undefined
        },
        utmSource: ' newsletter '
      })
    ).toEqual({
      eventName: 'today_viewed',
      module: 'today',
      route: '/today',
      properties: {
        itemCount: 3
      },
      anonymousId: null,
      sessionId: null,
      utmSource: 'newsletter',
      utmMedium: null,
      utmCampaign: null
    })
  })

  it('rejects unknown event names and modules', () => {
    expect(
      normalizeAnalyticsTrackInput({
        eventName: 'not_real',
        module: 'today'
      })
    ).toBeNull()

    expect(
      normalizeAnalyticsTrackInput({
        eventName: 'today_viewed',
        module: 'not_real'
      })
    ).toBeNull()
  })

  it('extracts source domains from URLs', () => {
    expect(sourceDomainFromUrl('https://www.example.com/item/1')).toBe('example.com')
    expect(sourceDomainFromUrl('blob:preview')).toBe('local_upload')
    expect(sourceDomainFromUrl('not-a-url')).toBe('unknown')
  })
})
