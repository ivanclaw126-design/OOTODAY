import { NextResponse } from 'next/server'
import { trackBetaEvent } from '@/lib/beta/telemetry'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    await trackBetaEvent(payload)
  } catch {
    // non-blocking by design
  }

  return NextResponse.json({ ok: true })
}
