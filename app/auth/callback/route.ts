import { NextResponse } from 'next/server'
import { bootstrapPasswordLogin } from '@/lib/auth/bootstrap-password-login'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/today'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        try {
          const result = await bootstrapPasswordLogin(user.id)

          if (result.error) {
            return NextResponse.redirect(new URL('/?auth_error=password_bootstrap_failed', url.origin))
          }
        } catch {
          return NextResponse.redirect(new URL('/?auth_error=password_bootstrap_failed', url.origin))
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
