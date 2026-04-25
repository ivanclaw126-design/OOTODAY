'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/track'
import type { AnalyticsEventName, AnalyticsModule, AnalyticsProperties } from '@/lib/analytics/events'

export function AnalyticsEventTracker({
  eventName,
  module,
  properties
}: {
  eventName: AnalyticsEventName
  module: AnalyticsModule
  properties?: AnalyticsProperties
}) {
  const propertiesKey = JSON.stringify(properties ?? {})

  useEffect(() => {
    void trackEvent({
      eventName,
      module,
      route: typeof window === 'undefined' ? null : window.location.pathname,
      properties: JSON.parse(propertiesKey) as AnalyticsProperties
    })
  }, [eventName, module, propertiesKey])

  return null
}
