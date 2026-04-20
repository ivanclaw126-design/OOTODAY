import { describe, expect, it, vi } from 'vitest'

const getClosetView = vi.fn()
const getWeather = vi.fn()
const generateTodayRecommendations = vi.fn()

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather
}))

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

describe('getTodayView', () => {
  it('returns non-weather recommendations when city is missing', async () => {
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: [
        {
          id: 'item-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: [],
          createdAt: '2026-04-19T10:00:00Z'
        }
      ]
    })
    generateTodayRecommendations.mockReturnValue([{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: null })).resolves.toEqual({
      itemCount: 2,
      city: null,
      weatherState: { status: 'not-set' },
      recommendations: [{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }],
      recommendationError: false
    })

    expect(getWeather).not.toHaveBeenCalled()
  })

  it('falls back when weather fetch fails', async () => {
    getClosetView.mockResolvedValue({ itemCount: 1, items: [] })
    getWeather.mockResolvedValue(null)
    generateTodayRecommendations.mockReturnValue([])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: 'Shanghai' })).resolves.toEqual({
      itemCount: 1,
      city: 'Shanghai',
      weatherState: { status: 'unavailable', city: 'Shanghai' },
      recommendations: [],
      recommendationError: false
    })
  })
})
