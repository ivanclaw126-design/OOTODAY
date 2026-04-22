import { beforeEach, describe, expect, it, vi } from 'vitest'

const limit = vi.fn()
const order = vi.fn()
const eq = vi.fn()
const select = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'travel_plans') {
    return { select }
  }

  if (table === 'outfits') {
    return { select: fallbackSelect }
  }

  throw new Error(`Unexpected table: ${table}`)
})
const fallbackLimit = vi.fn()
const fallbackOrder = vi.fn()
const fallbackEq = vi.fn()
const fallbackSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ from }))
}))

describe('getRecentTravelPlans', () => {
  beforeEach(() => {
    from.mockClear()
    select.mockReset()
    eq.mockReset()
    order.mockReset()
    limit.mockReset()
    fallbackSelect.mockReset()
    fallbackEq.mockReset()
    fallbackOrder.mockReset()
    fallbackLimit.mockReset()

    select.mockReturnValue({ eq })
    eq.mockReturnValue({ order })
    order.mockReturnValue({ limit })
    fallbackSelect.mockReturnValue({ eq: fallbackEq })
    fallbackEq.mockReturnValue({ order: fallbackOrder })
    fallbackOrder.mockReturnValue({ limit: fallbackLimit })
  })

  it('returns the latest saved travel plans in view shape', async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: 'travel-1',
          title: '上海 4天 · 通勤/休闲',
          destination_city: '上海',
          days: 4,
          scenes: ['通勤', '休闲'],
          weather_summary: 'Shanghai Municipality · 18°C · moderate rain',
          created_at: '2026-04-22T07:00:00.000Z'
        }
      ],
      error: null
    })

    const { getRecentTravelPlans } = await import('@/lib/travel/get-recent-travel-plans')

    await expect(getRecentTravelPlans('user-1')).resolves.toEqual([
      {
        id: 'travel-1',
        title: '上海 4天 · 通勤/休闲',
        destinationCity: '上海',
        days: 4,
        scenes: ['通勤', '休闲'],
        weatherSummary: 'Shanghai Municipality · 18°C · moderate rain',
        createdAt: '2026-04-22T07:00:00.000Z',
        source: 'travel_plans'
      }
    ])
  })

  it('falls back to outfits metadata when travel_plans is not available yet', async () => {
    limit.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "public.travel_plans" does not exist' }
    })
    fallbackLimit.mockResolvedValue({
      data: [
        {
          id: 'outfit-1',
          title: '上海 4天 · 通勤/休闲',
          scenario: 'travel:{"destinationCity":"上海","days":4,"scenes":["通勤","休闲"],"weatherSummary":"Shanghai Municipality · 18°C · moderate rain"}',
          created_at: '2026-04-22T07:00:00.000Z'
        }
      ],
      error: null
    })

    const { getRecentTravelPlans } = await import('@/lib/travel/get-recent-travel-plans')

    await expect(getRecentTravelPlans('user-1')).resolves.toEqual([
      {
        id: 'outfit-1',
        title: '上海 4天 · 通勤/休闲',
        destinationCity: '上海',
        days: 4,
        scenes: ['通勤', '休闲'],
        weatherSummary: 'Shanghai Municipality · 18°C · moderate rain',
        createdAt: '2026-04-22T07:00:00.000Z',
        source: 'outfits'
      }
    ])
  })
})
