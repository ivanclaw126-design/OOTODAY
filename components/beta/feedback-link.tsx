'use client'

import { sendBetaEventFromClient } from '@/lib/beta/telemetry'
import { getBetaFeedbackHref } from '@/lib/beta/first-run-content'

export function FeedbackLink({
  surface,
  label = '反馈',
  className
}: {
  surface: string
  label?: string
  className?: string
}) {
  const href = getBetaFeedbackHref(surface)

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        void sendBetaEventFromClient({
          event: 'feedback_opened',
          surface,
          pathname: typeof window === 'undefined' ? null : window.location.pathname
        })
      }}
    >
      {label}
    </a>
  )
}
