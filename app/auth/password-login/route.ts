import { NextResponse } from 'next/server'
import { bootstrapPasswordLoginByEmail } from '@/lib/auth/bootstrap-password-login'
import { DEFAULT_ACCOUNT_PASSWORD } from '@/lib/auth/password'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const url = new URL(request.url)
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.redirect(new URL('/?auth_error=missing_credentials', url.origin))
  }

  const normalizedEmail = email.trim()
  const normalizedPassword =
    typeof password === 'string' && password.trim() ? password.trim() : DEFAULT_ACCOUNT_PASSWORD

  const supabase = await createSupabaseServerClient()
  let { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword
  })

  if (!error) {
    return NextResponse.redirect(new URL('/today', url.origin))
  }

  if (normalizedPassword === DEFAULT_ACCOUNT_PASSWORD) {
    const repairResult = await bootstrapPasswordLoginByEmail(normalizedEmail)

    if (repairResult.skipped === 'password_changed') {
      return NextResponse.redirect(new URL('/?auth_error=custom_password_required', url.origin))
    }

    if (repairResult.passwordBootstrapped) {
      const retryResult = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: DEFAULT_ACCOUNT_PASSWORD
      })

      error = retryResult.error

      if (!error) {
        return NextResponse.redirect(new URL('/today', url.origin))
      }
    }
  }

  if (error) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_credentials', url.origin))
  }
 
  return NextResponse.redirect(new URL('/today', url.origin))
}
