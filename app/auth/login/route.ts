import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/', url.origin))
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL('/auth/callback', url.origin).toString()
    }
  })

  return NextResponse.redirect(new URL('/?magic_link=sent', url.origin))
}
