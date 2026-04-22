import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const saveTravelPlan = vi.fn()
const deleteTravelPlan = vi.fn()
const revalidatePath = vi.fn()
const redirect = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/travel/save-travel-plan', () => ({
  saveTravelPlan
}))

vi.mock('@/lib/travel/delete-travel-plan', () => ({
  deleteTravelPlan
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
    saveTravelPlan.mockReset()
    deleteTravelPlan.mockReset()
    revalidatePath.mockReset()
    redirect.mockReset()
  })

  it('saves the signed-in user travel plan and redirects back to the planner', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTravelPlan.mockResolvedValue({ id: 'travel-1', source: 'travel_plans' })

    const { saveTravelPlanAction } = await import('@/app/travel/actions')
    const formData = new FormData()
    formData.set('city', '上海')
    formData.set('days', '4')
    formData.append('scene', '通勤')
    formData.append('scene', '休闲')
    formData.set(
      'plan',
      JSON.stringify({
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
    )

    await saveTravelPlanAction(formData)

    expect(saveTravelPlan).toHaveBeenCalledWith({
      userId: 'user-1',
      plan: expect.objectContaining({
        destinationCity: '上海',
        days: 4
      })
    })
    expect(revalidatePath).toHaveBeenCalledWith('/travel')
    expect(redirect).toHaveBeenCalledWith(
      '/travel?city=%E4%B8%8A%E6%B5%B7&days=4&scene=%E9%80%9A%E5%8B%A4&scene=%E4%BC%91%E9%97%B2&savedPlanId=travel-1&saved=1'
    )
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
