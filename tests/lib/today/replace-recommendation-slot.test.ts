import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ClosetItemCardData } from '@/lib/closet/types'
import type { TodayRecommendation } from '@/lib/today/types'

const generateTodayRecommendations = vi.fn()

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

function item(overrides: Partial<ClosetItemCardData>): ClosetItemCardData {
  return {
    id: 'item',
    imageUrl: null,
    category: '上衣',
    subCategory: null,
    colorCategory: null,
    styleTags: [],
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-21T00:00:00.000Z',
    ...overrides
  }
}

const baseRecommendation: TodayRecommendation = {
  id: 'rec-base',
  reason: '基础组合',
  top: { id: 'top-1', imageUrl: null, category: '上衣', subCategory: '衬衫', colorCategory: '白色', styleTags: [] },
  bottom: { id: 'bottom-1', imageUrl: null, category: '裤装', subCategory: '西裤', colorCategory: '黑色', styleTags: [] },
  dress: null,
  outerLayer: null,
  shoes: { id: 'shoes-1', imageUrl: null, category: '鞋履', subCategory: '乐福鞋', colorCategory: '黑色', styleTags: [] },
  bag: null,
  accessories: [],
  missingSlots: [],
  confidence: 88,
  componentScores: {
    colorHarmony: 80,
    silhouetteBalance: 80,
    layering: 80,
    focalPoint: 80,
    sceneFit: 80,
    weatherComfort: 80,
    completeness: 80,
    freshness: 80
  },
  mode: 'daily'
}

describe('replaceRecommendationSlot', () => {
  beforeEach(() => {
    generateTodayRecommendations.mockReset()
  })

  it('keeps fixed slots and returns a scored replacement recommendation', async () => {
    const replacement = {
      ...baseRecommendation,
      id: 'rec-generated',
      shoes: { id: 'shoes-2', imageUrl: null, category: '鞋履', subCategory: '运动鞋', colorCategory: '白色', styleTags: [] },
      reason: '替换鞋履后更轻便',
      scoreBreakdown: { totalScore: 88 }
    }
    generateTodayRecommendations.mockReturnValue([replacement])

    const { replaceRecommendationSlot } = await import('@/lib/today/replace-recommendation-slot')
    const result = replaceRecommendationSlot({
      baseRecommendation,
      slot: 'shoes',
      items: [
        item({ id: 'top-1', category: '上衣', subCategory: '衬衫' }),
        item({ id: 'bottom-1', category: '裤装', subCategory: '西裤' }),
        item({ id: 'shoes-1', category: '鞋履', subCategory: '乐福鞋' }),
        item({ id: 'shoes-2', category: '鞋履', subCategory: '运动鞋' })
      ],
      weather: null,
      preferenceState: { profile: {}, finalWeights: {} } as never
    })

    expect(result).toEqual(expect.objectContaining({
      id: 'rec-base-replace-shoes-rec-generated',
      top: baseRecommendation.top,
      bottom: baseRecommendation.bottom,
      shoes: replacement.shoes,
      reason: '替换鞋履后更轻便',
      scoreBreakdown: { totalScore: 88 }
    }))
    expect(generateTodayRecommendations).toHaveBeenCalledWith(expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({ id: 'top-1' }),
        expect.objectContaining({ id: 'bottom-1' }),
        expect.objectContaining({ id: 'shoes-2' })
      ])
    }))
  })

  it('returns null when there are no alternative slot candidates', async () => {
    const { replaceRecommendationSlot } = await import('@/lib/today/replace-recommendation-slot')
    const result = replaceRecommendationSlot({
      baseRecommendation,
      slot: 'shoes',
      items: [
        item({ id: 'top-1', category: '上衣', subCategory: '衬衫' }),
        item({ id: 'bottom-1', category: '裤装', subCategory: '西裤' }),
        item({ id: 'shoes-1', category: '鞋履', subCategory: '乐福鞋' })
      ],
      weather: null,
      preferenceState: { profile: {}, finalWeights: {} } as never
    })

    expect(result).toBeNull()
    expect(generateTodayRecommendations).not.toHaveBeenCalled()
  })

  it('replaces one visible accessory while keeping the other accessory fixed', async () => {
    const accessoryRecommendation: TodayRecommendation = {
      ...baseRecommendation,
      accessories: [
        { id: 'accessory-1', imageUrl: null, category: '配饰', subCategory: '腰带', colorCategory: '黑色', styleTags: [] },
        { id: 'accessory-2', imageUrl: null, category: '配饰', subCategory: '丝巾', colorCategory: '蓝色', styleTags: [] }
      ]
    }
    const replacement = {
      ...accessoryRecommendation,
      id: 'rec-generated-accessory',
      accessories: [
        accessoryRecommendation.accessories[1],
        { id: 'accessory-3', imageUrl: null, category: '配饰', subCategory: '腕表', colorCategory: '银色', styleTags: [] }
      ]
    }
    generateTodayRecommendations.mockReturnValue([replacement])

    const { replaceRecommendationSlot } = await import('@/lib/today/replace-recommendation-slot')
    const result = replaceRecommendationSlot({
      baseRecommendation: accessoryRecommendation,
      slot: 'accessories',
      replaceItemId: 'accessory-1',
      items: [
        item({ id: 'top-1', category: '上衣', subCategory: '衬衫' }),
        item({ id: 'bottom-1', category: '裤装', subCategory: '西裤' }),
        item({ id: 'shoes-1', category: '鞋履', subCategory: '乐福鞋' }),
        item({ id: 'accessory-1', category: '配饰', subCategory: '腰带' }),
        item({ id: 'accessory-2', category: '配饰', subCategory: '丝巾' }),
        item({ id: 'accessory-3', category: '配饰', subCategory: '腕表' })
      ],
      weather: null,
      preferenceState: { profile: {}, finalWeights: {} } as never
    })

    expect(result?.accessories.map((accessory) => accessory.id)).toEqual(['accessory-2', 'accessory-3'])
    const generatedInput = generateTodayRecommendations.mock.calls[0]?.[0]
    expect(generatedInput.items.map((candidate: ClosetItemCardData) => candidate.id)).toEqual(expect.arrayContaining(['accessory-2', 'accessory-3']))
    expect(generatedInput.items.map((candidate: ClosetItemCardData) => candidate.id)).not.toContain('accessory-1')
  })
})
