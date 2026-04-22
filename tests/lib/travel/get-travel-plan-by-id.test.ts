import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const select = vi.fn()
const fallbackMaybeSingle = vi.fn()
const fallbackSelect = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'travel_plans') {
    return { select }
  }

  if (table === 'outfits') {
    return { select: fallbackSelect }
  }

  throw new Error(`Unexpected table: ${table}`)
})

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ from }))
}))

describe('getTravelPlanById', () => {
  beforeEach(() => {
    from.mockClear()
    select.mockReset()
    maybeSingle.mockReset()
    fallbackSelect.mockReset()
    fallbackMaybeSingle.mockReset()

    select.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle
        }))
      }))
    })

    fallbackSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: fallbackMaybeSingle
        }))
      }))
    })
  })

  it('returns the persisted travel_plans snapshot when available', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: 'travel-1',
        title: '上海 4天 · 通勤/休闲',
        destination_city: '上海',
        days: 4,
        scenes: ['通勤', '休闲'],
        weather_summary: 'Shanghai Municipality · 18°C · moderate rain',
        created_at: '2026-04-22T07:00:00.000Z',
        plan_json: {
          destinationCity: '上海',
          days: 4,
          scenes: ['通勤', '休闲'],
          suggestedOutfitCount: 2,
          weather: null,
          entries: [],
          dailyPlan: [],
          missingHints: [],
          notes: []
        }
      },
      error: null
    })

    const { getTravelPlanById } = await import('@/lib/travel/get-travel-plan-by-id')

    await expect(getTravelPlanById('user-1', 'travel-1')).resolves.toEqual({
      id: 'travel-1',
      title: '上海 4天 · 通勤/休闲',
      destinationCity: '上海',
      days: 4,
      scenes: ['通勤', '休闲'],
      weatherSummary: 'Shanghai Municipality · 18°C · moderate rain',
      createdAt: '2026-04-22T07:00:00.000Z',
      source: 'travel_plans',
      plan: {
        destinationCity: '上海',
        days: 4,
        scenes: ['通勤', '休闲'],
        suggestedOutfitCount: 2,
        weather: null,
        entries: [],
        dailyPlan: [],
        missingHints: [],
        notes: []
      }
    })
  })

  it('falls back to outfits snapshot when the dedicated table is unavailable', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "public.travel_plans" does not exist' }
    })
    fallbackMaybeSingle.mockResolvedValue({
      data: {
        id: 'outfit-1',
        title: '上海 4天 · 通勤/休闲',
        scenario:
          'travel:{"destinationCity":"上海","days":4,"scenes":["通勤","休闲"],"weatherSummary":"Shanghai Municipality · 18°C · moderate rain","plan":{"destinationCity":"上海","days":4,"scenes":["通勤","休闲"],"suggestedOutfitCount":2,"weather":null,"entries":[],"dailyPlan":[],"missingHints":[],"notes":[]}}',
        created_at: '2026-04-22T07:00:00.000Z'
      },
      error: null
    })

    const { getTravelPlanById } = await import('@/lib/travel/get-travel-plan-by-id')

    await expect(getTravelPlanById('user-1', 'outfit-1')).resolves.toEqual({
      id: 'outfit-1',
      title: '上海 4天 · 通勤/休闲',
      destinationCity: '上海',
      days: 4,
      scenes: ['通勤', '休闲'],
      weatherSummary: 'Shanghai Municipality · 18°C · moderate rain',
      createdAt: '2026-04-22T07:00:00.000Z',
      source: 'outfits',
      plan: {
        destinationCity: '上海',
        days: 4,
        scenes: ['通勤', '休闲'],
        suggestedOutfitCount: 2,
        weather: null,
        entries: [],
        dailyPlan: [],
        missingHints: [],
        notes: []
      }
    })
  })
})
