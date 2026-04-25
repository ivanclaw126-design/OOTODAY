import {
  reportBetaIssue as logBetaIssue,
  trackBetaEvent as logBetaEvent,
  type BetaEventPayload,
  type BetaIssueReport
} from '@/lib/beta/telemetry'
import { reportBetaIssueAsAnalytics, trackBetaEventAsAnalytics } from '@/lib/beta/analytics-adapter'

export async function trackBetaEvent(payload: BetaEventPayload, userId = payload.userId) {
  await logBetaEvent(payload)
  await trackBetaEventAsAnalytics(payload, userId)
}

export async function reportBetaIssue(payload: BetaIssueReport, userId = payload.userId) {
  await logBetaIssue(payload)
  await reportBetaIssueAsAnalytics(payload, userId)
}
