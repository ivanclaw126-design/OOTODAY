import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveTravelPlan } from '@/lib/travel/save-travel-plan'

const travelInsert = vi.fn()
const travelUpdate = vi.fn()
const travelSelect = vi.fn()
const travelSingle = vi.fn()
const outfitInsert = vi.fn()
const outfitUpdate = vi.fn()
const outfitSelect = vi.fn()
const outfitSingle = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'travel_plans') {
    return { insert: travelInsert, update: travelUpdate }
  }

  if (table === 'outfits') {
    return { insert: outfitInsert, update: outfitUpdate }
  }

  throw new Error(`Unexpected table: ${table}`)
})
const createSupabaseServerClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => createSupabaseServerClient()
}))

describe('saveTravelPlan', () => {
  beforeEach(() => {
    from.mockClear()
    travelInsert.mockReset()
    travelUpdate.mockReset()
    travelSelect.mockReset()
    travelSingle.mockReset()
    outfitInsert.mockReset()
    outfitUpdate.mockReset()
    outfitSelect.mockReset()
    outfitSingle.mockReset()
    createSupabaseServerClient.mockReset()
  })

  it('inserts a serialized travel plan and returns the new row id', async () => {
    travelSingle.mockResolvedValue({ data: { id: 'travel-1' }, error: null })
    travelSelect.mockReturnValue({ single: travelSingle })
    travelInsert.mockReturnValue({ select: travelSelect })
    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(
      saveTravelPlan({
        userId: 'user-1',
        plan: {
          destinationCity: '上海',
          days: 4,
          scenes: ['通勤', '休闲'],
          suggestedOutfitCount: 2,
          weather: {
            city: 'Shanghai Municipality',
            temperatureC: 18,
            conditionLabel: 'moderate rain',
            isWarm: false,
            isCold: false
          },
          entries: [],
          dailyPlan: [],
          missingHints: [],
          notes: []
        }
      })
    ).resolves.toEqual({ id: 'travel-1', source: 'travel_plans' })

    expect(from).toHaveBeenCalledWith('travel_plans')
    expect(travelInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        destination_city: '上海',
        days: 4,
        scenes: ['通勤', '休闲'],
        weather_summary: 'Shanghai Municipality · 18°C · moderate rain'
      })
    )
  })

  it('falls back to outfits when travel_plans is not available yet', async () => {
    travelSingle.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "public.travel_plans" does not exist' }
    })
    travelSelect.mockReturnValue({ single: travelSingle })
    travelInsert.mockReturnValue({ select: travelSelect })
    outfitSingle.mockResolvedValue({ data: { id: 'travel-fallback-1' }, error: null })
    outfitSelect.mockReturnValue({ single: outfitSingle })
    outfitInsert.mockReturnValue({ select: outfitSelect })
    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(
      saveTravelPlan({
        userId: 'user-1',
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
    ).resolves.toEqual({ id: 'travel-fallback-1', source: 'outfits' })

    expect(from).toHaveBeenCalledWith('outfits')
    expect(outfitInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        title: '上海 4天 · 通勤/休闲',
        item_ids: [],
        scenario: expect.stringContaining('travel:')
      })
    )
  })

  it('updates an existing travel_plans row when editing a saved plan', async () => {
    travelSingle.mockResolvedValue({ data: { id: 'travel-1' }, error: null })
    travelSelect.mockReturnValue({ single: travelSingle })
    travelUpdate.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: travelSelect
        }))
      }))
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(
      saveTravelPlan({
        userId: 'user-1',
        existingPlanId: 'travel-1',
        existingSource: 'travel_plans',
        plan: {
          destinationCity: '东京',
          days: 5,
          scenes: ['通勤'],
          suggestedOutfitCount: 3,
          weather: null,
          entries: [],
          dailyPlan: [],
          missingHints: [],
          notes: []
        }
      })
    ).resolves.toEqual({ id: 'travel-1', source: 'travel_plans' })

    expect(travelUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        destination_city: '东京',
        days: 5
      })
    )
  })

  it('updates an existing fallback outfits row when editing a saved fallback plan', async () => {
    travelSingle.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "public.travel_plans" does not exist' }
    })
    travelSelect.mockReturnValue({ single: travelSingle })
    travelInsert.mockReturnValue({ select: travelSelect })
    outfitSingle.mockResolvedValue({ data: { id: 'travel-fallback-1' }, error: null })
    outfitSelect.mockReturnValue({ single: outfitSingle })
    outfitUpdate.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: outfitSelect
        }))
      }))
    })
    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(
      saveTravelPlan({
        userId: 'user-1',
        existingPlanId: 'travel-fallback-1',
        existingSource: 'outfits',
        plan: {
          destinationCity: '东京',
          days: 5,
          scenes: ['正式'],
          suggestedOutfitCount: 2,
          weather: null,
          entries: [],
          dailyPlan: [],
          missingHints: [],
          notes: []
        }
      })
    ).resolves.toEqual({ id: 'travel-fallback-1', source: 'outfits' })

    expect(outfitUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '东京 5天 · 正式',
        scenario: expect.stringContaining('travel:')
      })
    )
  })
})
