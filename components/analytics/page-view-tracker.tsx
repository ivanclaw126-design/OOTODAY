'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/track'
import type { AnalyticsEventName, AnalyticsModule, AnalyticsProperties } from '@/lib/analytics/events'

export function PageViewTracker({
  eventName,
  module,
  properties
}: {
  eventName?: AnalyticsEventName
  module: AnalyticsModule
  properties?: AnalyticsProperties
}) {
  const propertiesKey = JSON.stringify(properties ?? {})

  useEffect(() => {
    const route = typeof window === 'undefined' ? null : window.location.pathname
    const normalizedProperties = JSON.parse(propertiesKey) as AnalyticsProperties

    void trackEvent({
      eventName: 'page_viewed',
      module,
      route,
      properties: normalizedProperties
    })

    if (eventName && eventName !== 'page_viewed') {
      void trackEvent({
        eventName,
        module,
        route,
        properties: normalizedProperties
      })
    }
  }, [eventName, module, propertiesKey])

  return null
}
