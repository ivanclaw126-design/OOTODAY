import { describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const from = vi.fn(() => ({ update: () => ({ eq }) }))
const createSupabaseServerClient = vi.fn(async () => ({ from }))
const revalidatePath = vi.fn()
const redirect = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('today actions', () => {
  it('updates the signed-in user city and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { updateTodayCityAction } = await import('@/app/today/actions')

    await expect(updateTodayCityAction({ city: 'Shanghai' })).resolves.toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('revalidates and redirects when refreshing recommendations', async () => {
    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await refreshTodayRecommendationsAction(3)

    expect(revalidatePath).toHaveBeenCalledWith('/today')
    expect(redirect).toHaveBeenCalledWith('/today?offset=3')
  })
})
