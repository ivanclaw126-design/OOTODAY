import { NextResponse } from 'next/server'
import { reportBetaIssue } from '@/lib/beta/telemetry'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    await reportBetaIssue(payload)
  } catch {
    // non-blocking by design
  }

  return NextResponse.json({ ok: true })
}
