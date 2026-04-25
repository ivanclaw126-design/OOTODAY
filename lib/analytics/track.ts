import type { AnalyticsTrackInput } from '@/lib/analytics/events'

function getUtmParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)
  return value?.trim() || null
}

export async function trackEvent(input: AnalyticsTrackInput) {
  try {
    const searchParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...input,
        route: input.route ?? (typeof window === 'undefined' ? null : window.location.pathname),
        utmSource: input.utmSource ?? (searchParams ? getUtmParam(searchParams, 'utm_source') : null),
        utmMedium: input.utmMedium ?? (searchParams ? getUtmParam(searchParams, 'utm_medium') : null),
        utmCampaign: input.utmCampaign ?? (searchParams ? getUtmParam(searchParams, 'utm_campaign') : null)
      }),
      keepalive: true
    })
  } catch {
    // Analytics must never block product flows.
  }
}
