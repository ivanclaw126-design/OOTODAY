import { sourceDomainFromUrl, type AnalyticsTrackInput } from '@/lib/analytics/events'
import { trackServerEvent } from '@/lib/analytics/server'
import type { BetaEventPayload, BetaIssueReport } from '@/lib/beta/telemetry'

function metadataWithLegacyEvent(payload: BetaEventPayload) {
  return {
    legacyEvent: payload.event,
    surface: payload.surface,
    ...(payload.metadata ?? {})
  }
}

export function betaEventToAnalyticsInput(payload: BetaEventPayload): AnalyticsTrackInput {
  if (payload.event === 'landing_viewed') {
    return {
      eventName: 'page_viewed',
      module: 'system',
      route: payload.pathname ?? '/',
      properties: metadataWithLegacyEvent(payload)
    }
  }

  if (payload.event === 'login_link_sent') {
    return {
      eventName: 'auth_login_link_sent',
      module: 'auth',
      route: payload.pathname ?? '/',
      properties: metadataWithLegacyEvent(payload)
    }
  }

  if (payload.event === 'closet_import_started') {
    return {
      eventName: 'closet_item_add_started',
      module: 'closet',
      route: payload.pathname ?? '/closet',
      properties: metadataWithLegacyEvent(payload)
    }
  }

  if (payload.event === 'closet_item_saved') {
    return {
      eventName: 'closet_item_created',
      module: 'closet',
      route: payload.pathname ?? '/closet',
      properties: metadataWithLegacyEvent(payload)
    }
  }

  if (payload.event === 'today_viewed') {
    return {
      eventName: 'today_viewed',
      module: 'today',
      route: payload.pathname ?? '/today',
      properties: metadataWithLegacyEvent(payload)
    }
  }

  if (payload.event === 'ootd_submitted') {
    return {
      eventName: 'today_ootd_submitted',
      module: 'today',
      route: payload.pathname ?? '/today',
      properties: metadataWithLegacyEvent(payload)
    }
  }

  return {
    eventName: 'feedback_opened',
    module: 'system',
    route: payload.pathname,
    properties: metadataWithLegacyEvent(payload)
  }
}

export function betaIssueToAnalyticsInput(payload: BetaIssueReport): AnalyticsTrackInput {
  return {
    eventName: payload.recoverable ? 'server_action_failed' : 'error_shown',
    module: 'system',
    properties: {
      code: payload.code,
      surface: payload.surface,
      recoverable: payload.recoverable,
      sourceDomain:
        typeof payload.context?.sourceUrl === 'string'
          ? sourceDomainFromUrl(payload.context.sourceUrl)
          : undefined,
      ...(payload.context ?? {})
    }
  }
}

export async function trackBetaEventAsAnalytics(payload: BetaEventPayload, userId = payload.userId) {
  await trackServerEvent({
    ...betaEventToAnalyticsInput(payload),
    userId
  })
}

export async function reportBetaIssueAsAnalytics(payload: BetaIssueReport, userId = payload.userId) {
  await trackServerEvent({
    ...betaIssueToAnalyticsInput(payload),
    userId
  })
}
