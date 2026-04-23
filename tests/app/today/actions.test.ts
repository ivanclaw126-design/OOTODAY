import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const maybeSingle = vi.fn(() => Promise.resolve({ data: { city: 'Shanghai' } }))
const selectProfiles = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }))
const updateProfiles = vi.fn(() => ({ eq }))
const from = vi.fn((table: string) => {
  if (table === 'profiles') {
    return {
      update: updateProfiles,
      select: selectProfiles
    }
  }

  return { update: () => ({ eq }) }
})
const updateUser = vi.fn(() => Promise.resolve({ error: null }))
const getUser = vi.fn(() => Promise.resolve({ data: { user: { user_metadata: {} } } }))
const createSupabaseServerClient = vi.fn(async () => ({ from, auth: { updateUser, getUser } }))
const revalidatePath = vi.fn()
const saveTodayOotdFeedback = vi.fn()
const getClosetView = vi.fn()
const getWeather = vi.fn()
const generateTodayRecommendations = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('@/lib/today/save-today-ootd-feedback', () => ({
  saveTodayOotdFeedback
}))

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather
}))

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

describe('today actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    eq.mockClear()
    maybeSingle.mockReset()
    maybeSingle.mockResolvedValue({ data: { city: 'Shanghai' } })
    selectProfiles.mockClear()
    updateProfiles.mockClear()
    from.mockClear()
    createSupabaseServerClient.mockClear()
    updateUser.mockReset()
    updateUser.mockResolvedValue({ error: null })
    getUser.mockReset()
    getUser.mockResolvedValue({ data: { user: { user_metadata: {} } } })
    revalidatePath.mockReset()
    saveTodayOotdFeedback.mockReset()
    getClosetView.mockReset()
    getWeather.mockReset()
    generateTodayRecommendations.mockReset()
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

  it('returns a fresh recommendation batch without redirecting the page', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: [{ id: 'item-1' }, { id: 'item-2' }]
    })
    getWeather.mockResolvedValue({ city: 'Shanghai', temperatureC: 24, conditionLabel: '晴', isWarm: true, isCold: false })
    generateTodayRecommendations.mockReturnValue([{ id: 'rec-1' }, { id: 'rec-2' }])

    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await expect(refreshTodayRecommendationsAction(3)).resolves.toEqual({
      recommendations: [{ id: 'rec-1' }, { id: 'rec-2' }]
    })

    expect(getClosetView).toHaveBeenCalledWith('user-1', { limit: 0 })
    expect(generateTodayRecommendations).toHaveBeenCalledWith([{ id: 'item-1' }, { id: 'item-2' }], expect.any(Object), 3)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('updates the signed-in user password and records password state', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { changeTodayPasswordAction } = await import('@/app/today/actions')

    await expect(changeTodayPasswordAction({ password: 'newpass123', confirmPassword: 'newpass123' })).resolves.toEqual({
      error: null
    })

    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'newpass123',
        data: expect.objectContaining({
          password_bootstrapped: true
        })
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })
})
