import { describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const ensureProfile = vi.fn()
const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/profiles/ensure-profile', () => ({
  ensureProfile
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('PreferencesRoute', () => {
  it('redirects signed-out users to landing', async () => {
    getSession.mockResolvedValue(null)

    const PreferencesRoute = (await import('@/app/preferences/page')).default

    await expect(PreferencesRoute()).rejects.toThrow('redirect:/')
  })

  it('ensures a profile before rendering the questionnaire', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const PreferencesRoute = (await import('@/app/preferences/page')).default
    const result = await PreferencesRoute()

    expect(ensureProfile).toHaveBeenCalledWith('user-1')
    expect(result.type.name).toBe('AppShell')
  })
})
