import { describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const ensureProfile = vi.fn()
const getPreferenceState = vi.fn()
const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/profiles/ensure-profile', () => ({
  ensureProfile
}))

vi.mock('@/lib/recommendation/get-preference-state', () => ({
  getPreferenceState
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('SettingsRoute', () => {
  it('redirects signed-out users to landing', async () => {
    getSession.mockResolvedValue(null)

    const SettingsRoute = (await import('@/app/settings/page')).default

    await expect(SettingsRoute()).rejects.toThrow('redirect:/')
  })

  it('loads the signed-in user preference state before rendering settings', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getPreferenceState.mockResolvedValue({
      source: 'adaptive',
      updatedAt: '2026-04-24T06:00:00.000Z'
    })

    const SettingsRoute = (await import('@/app/settings/page')).default
    const result = await SettingsRoute()

    expect(ensureProfile).toHaveBeenCalledWith('user-1')
    expect(getPreferenceState).toHaveBeenCalledWith({ userId: 'user-1' })
    expect(result.type.name).toBe('AppShell')
  })
})
