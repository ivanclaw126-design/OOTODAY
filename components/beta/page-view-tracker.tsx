'use client'

import { useEffect } from 'react'
import type { BetaEventName } from '@/lib/beta/telemetry'
import { sendBetaEventFromClient } from '@/lib/beta/telemetry'

export function PageViewTracker({ event, surface }: { event: BetaEventName; surface: string }) {
  useEffect(() => {
    void sendBetaEventFromClient({
      event,
      surface,
      pathname: typeof window === 'undefined' ? null : window.location.pathname
    })
  }, [event, surface])

  return null
}
