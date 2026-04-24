import { describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const getBetaBootstrapState = vi.fn()
const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/beta/bootstrap', () => ({
  getBetaBootstrapState
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('HomePage', () => {
  it('keeps signed-out users on landing', async () => {
    getSession.mockResolvedValue(null)

    const HomePage = (await import('@/app/page')).default
    const result = await HomePage({
      searchParams: Promise.resolve({ magic_link: 'sent' })
    })

    expect(result.props.magicLinkSent).toBe(true)
    expect(result.props.authError).toBe(null)
  })

  it('redirects signed-in users to closet onboarding when they have no saved items', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getBetaBootstrapState.mockResolvedValue({
      itemCount: 0,
      hasCity: false,
      hasOotdHistory: false,
      recommendedEntryRoute: '/closet?onboarding=1'
    })

    const HomePage = (await import('@/app/page')).default

    await expect(
      HomePage({
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow('redirect:/closet?onboarding=1')
  })

  it('redirects signed-in users with items to today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-2' } })
    getBetaBootstrapState.mockResolvedValue({
      itemCount: 4,
      hasCity: true,
      hasOotdHistory: true,
      recommendedEntryRoute: '/today'
    })

    const HomePage = (await import('@/app/page')).default

    await expect(
      HomePage({
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow('redirect:/today')
  })
})
