export type BetaEventName =
  | 'landing_viewed'
  | 'login_link_sent'
  | 'closet_import_started'
  | 'closet_item_saved'
  | 'today_viewed'
  | 'ootd_submitted'
  | 'feedback_opened'

export type BetaEventPayload = {
  event: BetaEventName
  surface: string
  userId?: string | null
  pathname?: string | null
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export type BetaIssueReport = {
  code: string
  surface: string
  userId?: string | null
  context?: Record<string, string | number | boolean | null | undefined>
  recoverable: boolean
}

function normalizeMetadata(input?: Record<string, string | number | boolean | null | undefined>) {
  if (!input) {
    return undefined
  }

  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
}

export async function trackBetaEvent(payload: BetaEventPayload) {
  console.info(
    JSON.stringify({
      type: 'beta_event',
      ...payload,
      metadata: normalizeMetadata(payload.metadata),
      timestamp: new Date().toISOString()
    })
  )
}

export async function reportBetaIssue(payload: BetaIssueReport) {
  console.error(
    JSON.stringify({
      type: 'beta_issue',
      ...payload,
      context: normalizeMetadata(payload.context),
      timestamp: new Date().toISOString()
    })
  )
}

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      keepalive: true
    })
  } catch {
    // telemetry must never block product flows
  }
}

export async function sendBetaEventFromClient(payload: BetaEventPayload) {
  await postJson('/api/beta/track', payload)
}

export async function sendBetaIssueFromClient(payload: BetaIssueReport) {
  await postJson('/api/beta/report', payload)
}
