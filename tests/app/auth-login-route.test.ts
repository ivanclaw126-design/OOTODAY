import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOtp = vi.fn()
const createSupabaseServerClient = vi.fn(async () => ({
  auth: {
    signInWithOtp
  }
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

describe('auth login route', () => {
  beforeEach(() => {
    signInWithOtp.mockReset()
    createSupabaseServerClient.mockClear()
  })

  it('redirects to success state when magic link send succeeds', async () => {
    signInWithOtp.mockResolvedValue({ error: null })

    const { POST } = await import('@/app/auth/login/route')
    const request = new Request('https://ootoday-ecru.vercel.app/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ email: 'user@example.com' })
    })

    const response = await POST(request)

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: {
        emailRedirectTo: 'https://ootoday-ecru.vercel.app/auth/callback'
      }
    })
    expect(response.headers.get('location')).toBe('https://ootoday-ecru.vercel.app/?magic_link=sent')
  })

  it('surfaces provider errors instead of pretending the mail was sent', async () => {
    signInWithOtp.mockResolvedValue({
      error: {
        message: 'Error sending confirmation email'
      }
    })

    const { POST } = await import('@/app/auth/login/route')
    const request = new Request('https://ootoday-ecru.vercel.app/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ email: 'user@example.com' })
    })

    const response = await POST(request)

    expect(response.headers.get('location')).toBe(
      'https://ootoday-ecru.vercel.app/?auth_error=magic_link_email_provider_failed'
    )
  })
})
