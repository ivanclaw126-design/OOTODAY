import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { trackBetaEvent } from '@/lib/beta/server-telemetry'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const session = await getSession()
    await trackBetaEvent(payload, session?.user.id ?? payload?.userId)
  } catch {
    // non-blocking by design
  }

  return NextResponse.json({ ok: true })
}
