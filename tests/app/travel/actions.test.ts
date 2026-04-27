import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const getClosetView = vi.fn()
const getPreferenceState = vi.fn()
const buildTravelPackingPlan = vi.fn()
const getWeather = vi.fn()
const saveTravelPlan = vi.fn()
const deleteTravelPlan = vi.fn()
const revalidatePath = vi.fn()
const redirect = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/recommendation/get-preference-state', () => ({
  getPreferenceState
}))

vi.mock('@/lib/travel/build-travel-packing-plan', () => ({
  buildTravelPackingPlan
}))

vi.mock('@/lib/travel/save-travel-plan', () => ({
  saveTravelPlan
}))

vi.mock('@/lib/travel/delete-travel-plan', () => ({
  deleteTravelPlan
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('travel actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    getClosetView.mockReset()
    getPreferenceState.mockReset()
    buildTravelPackingPlan.mockReset()
    getWeather.mockReset()
    saveTravelPlan.mockReset()
    deleteTravelPlan.mockReset()
    revalidatePath.mockReset()
    redirect.mockReset()
  })

  it('saves the signed-in user travel plan and redirects back to the planner', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({ itemCount: 2, items: [{ id: 'item-1' }] })
    getPreferenceState.mockResolvedValue(null)
    getWeather.mockResolvedValue({ city: 'Shanghai', temperatureC: 18, conditionLabel: 'cloudy', isWarm: false, isCold: false })
    buildTravelPackingPlan.mockReturnValue({
      destinationCity: '上海',
      days: 4,
      scenes: ['通勤', '休闲'],
      suggestedOutfitCount: 2,
      weather: null,
      entries: [],
      dailyPlan: [],
      missingHints: [],
      notes: []
    })
    saveTravelPlan.mockResolvedValue({ id: 'travel-1', source: 'travel_plans' })

    const { saveTravelPlanAction } = await import('@/app/travel/actions')
    const formData = new FormData()
    formData.set('city', '上海')
    formData.set('days', '4')
    formData.append('scene', '通勤')
    formData.append('scene', '休闲')

    await saveTravelPlanAction(formData)

    expect(getClosetView).toHaveBeenCalledWith('user-1', { limit: 0 })
    expect(buildTravelPackingPlan).toHaveBeenCalledWith(expect.objectContaining({
      destinationCity: '上海',
      days: 4,
      scenes: ['通勤', '休闲'],
      items: [{ id: 'item-1' }],
      weather: { city: 'Shanghai', temperatureC: 18, conditionLabel: 'cloudy', isWarm: false, isCold: false },
      preferenceState: null
    }))
    expect(saveTravelPlan).toHaveBeenCalledWith({
      userId: 'user-1',
      plan: expect.objectContaining({
        destinationCity: '上海',
        days: 4
      }),
      existingPlanId: null,
      existingSource: null
    })
    expect(revalidatePath).toHaveBeenCalledWith('/travel')
    expect(redirect).toHaveBeenCalledWith(
      '/travel?city=%E4%B8%8A%E6%B5%B7&days=4&scene=%E9%80%9A%E5%8B%A4&scene=%E4%BC%91%E9%97%B2&savedPlanId=travel-1&saved=1'
    )
  })

  it('updates the current saved travel plan instead of creating a new one', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({ itemCount: 2, items: [{ id: 'item-1' }, { id: 'item-2' }] })
    getPreferenceState.mockResolvedValue(null)
    getWeather.mockResolvedValue(null)
    buildTravelPackingPlan.mockReturnValue({
      destinationCity: '东京',
      days: 5,
      scenes: ['通勤'],
      suggestedOutfitCount: 3,
      weather: null,
      entries: [],
      dailyPlan: [],
      missingHints: [],
      notes: []
    })
    saveTravelPlan.mockResolvedValue({ id: 'travel-1', source: 'travel_plans' })

    const { saveTravelPlanAction } = await import('@/app/travel/actions')
    const formData = new FormData()
    formData.set('city', '东京')
    formData.set('days', '5')
    formData.append('scene', '通勤')
    formData.set('savedPlanId', 'travel-1')
    formData.set('savedPlanSource', 'travel_plans')

    await saveTravelPlanAction(formData)

    expect(saveTravelPlan).toHaveBeenCalledWith({
      userId: 'user-1',
      plan: expect.objectContaining({
        destinationCity: '东京',
        days: 5
      }),
      existingPlanId: 'travel-1',
      existingSource: 'travel_plans'
    })
    expect(redirect).toHaveBeenCalledWith('/travel?city=%E4%B8%9C%E4%BA%AC&days=5&scene=%E9%80%9A%E5%8B%A4&savedPlanId=travel-1&updated=1')
  })

  it('rejects saving when the closet has no items', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({ itemCount: 0, items: [] })

    const { saveTravelPlanAction } = await import('@/app/travel/actions')
    const formData = new FormData()
    formData.set('city', '东京')
    formData.set('days', '3')

    await expect(saveTravelPlanAction(formData)).rejects.toThrow('衣橱还没有可用于旅行打包的单品')
    expect(saveTravelPlan).not.toHaveBeenCalled()
  })

  it('deletes a saved travel plan for the signed-in user', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    deleteTravelPlan.mockResolvedValue(undefined)

    const { deleteTravelPlanAction } = await import('@/app/travel/actions')

    await deleteTravelPlanAction({
      planId: 'travel-1',
      source: 'travel_plans'
    })

    expect(deleteTravelPlan).toHaveBeenCalledWith({
      userId: 'user-1',
      planId: 'travel-1',
      source: 'travel_plans'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/travel')
  })
})
