import { normalizeAnalyticsTrackInput, type AnalyticsTrackInput } from '@/lib/analytics/events'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function trackServerEvent(input: AnalyticsTrackInput & { userId?: string | null }) {
  try {
    const normalized = normalizeAnalyticsTrackInput(input)

    if (!normalized || !input.userId) {
      return
    }

    const supabase = await createSupabaseServerClient()

    await supabase.from('analytics_events').insert({
      user_id: input.userId,
      anonymous_id: normalized.anonymousId,
      session_id: normalized.sessionId,
      event_name: normalized.eventName,
      module: normalized.module,
      route: normalized.route,
      properties: normalized.properties,
      utm_source: normalized.utmSource,
      utm_medium: normalized.utmMedium,
      utm_campaign: normalized.utmCampaign
    })
  } catch {
    // Analytics must never block product flows.
  }
}
