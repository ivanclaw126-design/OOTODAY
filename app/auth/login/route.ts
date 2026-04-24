import { NextResponse } from 'next/server'
import { reportBetaIssue, trackBetaEvent } from '@/lib/beta/telemetry'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function getMagicLinkErrorCode(message: string | null | undefined) {
  const normalizedMessage = (message ?? '').toLowerCase()

  if (normalizedMessage.includes('rate limit') || normalizedMessage.includes('security purposes')) {
    return 'magic_link_rate_limited'
  }

  if (normalizedMessage.includes('email') && normalizedMessage.includes('invalid')) {
    return 'magic_link_invalid_email'
  }

  if (
    normalizedMessage.includes('smtp') ||
    normalizedMessage.includes('email provider') ||
    normalizedMessage.includes('send email') ||
    normalizedMessage.includes('confirmation email')
  ) {
    return 'magic_link_email_provider_failed'
  }

  return 'magic_link_failed'
}

async function requestMagicLink(request: Request, email: string | null) {
  const url = new URL(request.url)

  if (!email) {
    return NextResponse.redirect(new URL('/?auth_error=magic_link_missing_email', url.origin))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: new URL('/auth/callback', url.origin).toString()
    }
  })

  if (error) {
    await reportBetaIssue({
      code: getMagicLinkErrorCode(error.message),
      surface: 'auth_login',
      recoverable: true,
      context: {
        emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown'
      }
    })
    return NextResponse.redirect(new URL(`/?auth_error=${getMagicLinkErrorCode(error.message)}`, url.origin))
  }

  await trackBetaEvent({
    event: 'login_link_sent',
    surface: 'auth_login',
    metadata: {
      emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown'
    }
  })

  return NextResponse.redirect(new URL('/?magic_link=sent', url.origin))
}

export async function GET(request: Request) {
  const url = new URL(request.url)

  return requestMagicLink(request, url.searchParams.get('email'))
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email')

  return requestMagicLink(request, typeof email === 'string' ? email : null)
}
