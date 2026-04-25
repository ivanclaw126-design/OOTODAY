import type { Json } from '@/types/database'

export const ANALYTICS_MODULES = [
  'auth',
  'closet',
  'today',
  'travel',
  'shop',
  'inspiration',
  'system'
] as const

export type AnalyticsModule = (typeof ANALYTICS_MODULES)[number]

export const ANALYTICS_EVENT_NAMES = [
  'page_viewed',
  'auth_login_link_sent',
  'auth_signed_in',
  'auth_signed_up',
  'feedback_opened',
  'closet_viewed',
  'closet_item_add_started',
  'closet_item_created',
  'closet_empty_state_viewed',
  'today_viewed',
  'today_recommendation_generated',
  'today_recommendation_refreshed',
  'today_ootd_submitted',
  'today_empty_closet_blocked',
  'travel_viewed',
  'travel_plan_generated',
  'travel_plan_saved',
  'travel_empty_closet_blocked',
  'shop_viewed',
  'shop_candidate_url_submitted',
  'shop_candidate_analyze_started',
  'shop_candidate_analyze_succeeded',
  'shop_candidate_analyze_failed',
  'shop_candidate_saved_to_closet',
  'inspiration_viewed',
  'error_shown',
  'server_action_failed'
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

export type AnalyticsProperties = Record<string, Json | undefined>

export type AnalyticsTrackInput = {
  eventName: AnalyticsEventName
  module: AnalyticsModule
  route?: string | null
  properties?: AnalyticsProperties
  anonymousId?: string | null
  sessionId?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

export type NormalizedAnalyticsTrackInput = {
  eventName: AnalyticsEventName
  module: AnalyticsModule
  route: string | null
  properties: Record<string, Json>
  anonymousId: string | null
  sessionId: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

const moduleSet = new Set<string>(ANALYTICS_MODULES)
const eventNameSet = new Set<string>(ANALYTICS_EVENT_NAMES)

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeProperties(value: unknown): Record<string, Json> {
  if (!isPlainObject(value)) {
    return {}
  }

  const filtered = Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))

  try {
    const serialized = JSON.parse(JSON.stringify(filtered)) as unknown
    return isPlainObject(serialized) ? (serialized as Record<string, Json>) : {}
  } catch {
    return {}
  }
}

export function normalizeAnalyticsTrackInput(value: unknown): NormalizedAnalyticsTrackInput | null {
  if (!isPlainObject(value)) {
    return null
  }

  const eventName = value.eventName
  const moduleName = value.module

  if (typeof eventName !== 'string' || !eventNameSet.has(eventName)) {
    return null
  }

  if (typeof moduleName !== 'string' || !moduleSet.has(moduleName)) {
    return null
  }

  return {
    eventName: eventName as AnalyticsEventName,
    module: moduleName as AnalyticsModule,
    route: normalizeNullableString(value.route),
    properties: normalizeProperties(value.properties),
    anonymousId: normalizeNullableString(value.anonymousId),
    sessionId: normalizeNullableString(value.sessionId),
    utmSource: normalizeNullableString(value.utmSource),
    utmMedium: normalizeNullableString(value.utmMedium),
    utmCampaign: normalizeNullableString(value.utmCampaign)
  }
}

export function sourceDomainFromUrl(value: string) {
  if (value.startsWith('blob:')) {
    return 'local_upload'
  }

  try {
    return new URL(value).hostname.replace(/^www\./, '') || 'unknown'
  } catch {
    return 'unknown'
  }
}
