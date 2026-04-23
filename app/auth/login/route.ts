import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function requestMagicLink(request: Request, email: string | null) {
  const url = new URL(request.url)

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

export async function GET(request: Request) {
  const url = new URL(request.url)

  return requestMagicLink(request, url.searchParams.get('email'))
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email')

  return requestMagicLink(request, typeof email === 'string' ? email : null)
}
