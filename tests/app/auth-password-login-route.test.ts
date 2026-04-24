import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const createSupabaseServerClient = vi.fn(async () => ({
  auth: {
    signInWithPassword
  }
}))
const bootstrapPasswordLoginByEmail = vi.fn()
const getBetaBootstrapState = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('@/lib/auth/bootstrap-password-login', () => ({
  bootstrapPasswordLoginByEmail
}))

vi.mock('@/lib/beta/bootstrap', () => ({
  getBetaBootstrapState
}))

function buildFormBody(values: Record<string, string>) {
  return new URLSearchParams(values).toString()
}

describe('auth password login route', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
    createSupabaseServerClient.mockClear()
    bootstrapPasswordLoginByEmail.mockReset()
    getBetaBootstrapState.mockReset()
    getBetaBootstrapState.mockResolvedValue({
      itemCount: 0,
      hasCity: false,
      hasOotdHistory: false,
      recommendedEntryRoute: '/closet?onboarding=1'
    })
  })

  it('uses the default password when the user only submits an email', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const { POST } = await import('@/app/auth/password-login/route')
    const request = new Request('https://ootoday-ecru.vercel.app/auth/password-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: buildFormBody({ email: 'ivanwuyh@163.com' })
    })

    const response = await POST(request)

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'ivanwuyh@163.com',
      password: '123456'
    })
    expect(getBetaBootstrapState).toHaveBeenCalledWith('user-1')
    expect(response.headers.get('location')).toBe('https://ootoday-ecru.vercel.app/closet?onboarding=1')
  })

  it('repairs old accounts with the default password and retries login once', async () => {
    signInWithPassword
      .mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } })
      .mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    bootstrapPasswordLoginByEmail.mockResolvedValue({ passwordBootstrapped: true })
    getBetaBootstrapState.mockResolvedValue({
      itemCount: 4,
      hasCity: false,
      hasOotdHistory: false,
      recommendedEntryRoute: '/today'
    })

    const { POST } = await import('@/app/auth/password-login/route')
    const request = new Request('https://ootoday-ecru.vercel.app/auth/password-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: buildFormBody({ email: 'ivanwuyh@163.com' })
    })

    const response = await POST(request)

    expect(bootstrapPasswordLoginByEmail).toHaveBeenCalledWith('ivanwuyh@163.com')
    expect(signInWithPassword).toHaveBeenCalledTimes(2)
    expect(getBetaBootstrapState).toHaveBeenCalledWith('user-1')
    expect(response.headers.get('location')).toBe('https://ootoday-ecru.vercel.app/today')
  })

  it('asks for a custom password if the account has already changed away from the default', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    bootstrapPasswordLoginByEmail.mockResolvedValue({ passwordBootstrapped: false, skipped: 'password_changed' })

    const { POST } = await import('@/app/auth/password-login/route')
    const request = new Request('https://ootoday-ecru.vercel.app/auth/password-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: buildFormBody({ email: 'ivanwuyh@163.com' })
    })

    const response = await POST(request)

    expect(response.headers.get('location')).toBe(
      'https://ootoday-ecru.vercel.app/?auth_error=custom_password_required'
    )
  })
})
