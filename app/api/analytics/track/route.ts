import { NextResponse } from 'next/server'
import { normalizeAnalyticsTrackInput } from '@/lib/analytics/events'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const normalized = normalizeAnalyticsTrackInput(await request.json())

    if (!normalized) {
      return NextResponse.json({ ok: true })
    }

    const session = await getSession()

    if (!session) {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createSupabaseServerClient()

    await supabase.from('analytics_events').insert({
      user_id: session.user.id,
      anonymous_id: normalized.anonymousId,
      session_id: normalized.sessionId,
      event_name: normalized.eventName,
      module: normalized.module,
      route: normalized.route,
      properties: normalized.properties,
      user_agent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
      utm_source: normalized.utmSource,
      utm_medium: normalized.utmMedium,
      utm_campaign: normalized.utmCampaign
    })
  } catch {
    // Analytics is intentionally best-effort.
  }

  return NextResponse.json({ ok: true })
}
