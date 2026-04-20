import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const from = vi.fn(() => ({ update: () => ({ eq }) }))
const createSupabaseServerClient = vi.fn(async () => ({ from }))
const revalidatePath = vi.fn()
const redirect = vi.fn()
const saveTodayOotdFeedback = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('@/lib/today/save-today-ootd-feedback', () => ({
  saveTodayOotdFeedback
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('today actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    eq.mockClear()
    from.mockClear()
    createSupabaseServerClient.mockClear()
    revalidatePath.mockReset()
    redirect.mockReset()
    saveTodayOotdFeedback.mockReset()
  })

  it('updates the signed-in user city and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { updateTodayCityAction } = await import('@/app/today/actions')

    await expect(updateTodayCityAction({ city: 'Shanghai' })).resolves.toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('saves today ootd feedback and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    const recommendation = {
      id: 'rec-1',
      reason: '基础组合稳定不出错',
      top: {
        id: 'top-1',
        imageUrl: null,
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '白色',
        styleTags: ['通勤']
      },
      bottom: {
        id: 'bottom-1',
        imageUrl: null,
        category: '裤装',
        subCategory: '西裤',
        colorCategory: '黑色',
        styleTags: ['通勤']
      },
      dress: null,
      outerLayer: null
    }

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(submitTodayOotdAction({ recommendation, satisfactionScore: 4 })).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    expect(saveTodayOotdFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      recommendation,
      satisfactionScore: 4
    })
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('returns duplicate error without revalidating when today is already recorded', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: '今天已经记录过穿搭了',
      wornAt: null
    })

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(
      submitTodayOotdAction({
        recommendation: {
          id: 'rec-1',
          reason: '基础组合稳定不出错',
          top: null,
          bottom: null,
          dress: null,
          outerLayer: null
        },
        satisfactionScore: 4
      })
    ).resolves.toEqual({
      error: '今天已经记录过穿搭了',
      wornAt: null
    })

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates and redirects when refreshing recommendations', async () => {
    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await refreshTodayRecommendationsAction(3)

    expect(revalidatePath).toHaveBeenCalledWith('/today')
    expect(redirect).toHaveBeenCalledWith('/today?offset=3')
  })
})
