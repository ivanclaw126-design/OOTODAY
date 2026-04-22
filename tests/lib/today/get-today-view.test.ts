import { describe, expect, it, vi } from 'vitest'

const getClosetView = vi.fn()
const getWeather = vi.fn()
const generateTodayRecommendations = vi.fn()
const getTodayOotdStatus = vi.fn()
const getRecentOotdHistory = vi.fn()

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather
}))

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

vi.mock('@/lib/today/get-today-ootd-status', () => ({
  getTodayOotdStatus
}))

vi.mock('@/lib/today/get-recent-ootd-history', () => ({
  getRecentOotdHistory
}))

describe('getTodayView', () => {
  it('returns non-weather recommendations and not-recorded status when city is missing', async () => {
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
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        }
      ]
    })
    getTodayOotdStatus.mockResolvedValue({ status: 'not-recorded' })
    getRecentOotdHistory.mockResolvedValue([])
    generateTodayRecommendations.mockReturnValue([{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: null })).resolves.toEqual({
      itemCount: 2,
      city: null,
      weatherState: { status: 'not-set' },
      recommendations: [{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }],
      recommendationError: false,
      ootdStatus: { status: 'not-recorded' },
      recentOotdHistory: []
    })

    expect(getWeather).not.toHaveBeenCalled()
  })

  it('returns recorded status when today is already saved', async () => {
    getClosetView.mockResolvedValue({ itemCount: 1, items: [] })
    getWeather.mockResolvedValue(null)
    getTodayOotdStatus.mockResolvedValue({
      status: 'recorded',
      wornAt: '2026-04-21T08:00:00.000Z'
    })
    getRecentOotdHistory.mockResolvedValue([
      {
        id: 'ootd-1',
        wornAt: '2026-04-21T08:00:00.000Z',
        satisfactionScore: 4,
        notes: 'OOTD: 衬衫 + 西裤；理由：基础组合稳定不出错'
      }
    ])
    generateTodayRecommendations.mockReturnValue([])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: 'Shanghai' })).resolves.toEqual({
      itemCount: 1,
      city: 'Shanghai',
      weatherState: { status: 'unavailable', city: 'Shanghai' },
      recommendations: [],
      recommendationError: false,
      ootdStatus: {
        status: 'recorded',
        wornAt: '2026-04-21T08:00:00.000Z'
      },
      recentOotdHistory: [
        {
          id: 'ootd-1',
          wornAt: '2026-04-21T08:00:00.000Z',
          satisfactionScore: 4,
          notes: 'OOTD: 衬衫 + 西裤；理由：基础组合稳定不出错'
        }
      ]
    })
  })
})
