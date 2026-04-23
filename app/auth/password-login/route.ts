import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const url = new URL(request.url)
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
    return NextResponse.redirect(new URL('/?auth_error=missing_credentials', url.origin))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })

  if (error) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_credentials', url.origin))
  }

  return NextResponse.redirect(new URL('/today', url.origin))
}
