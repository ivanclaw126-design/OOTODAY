import { describe, expect, it } from 'vitest'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'

const items = [
  {
    id: 'top-1',
    imageUrl: 'https://example.com/top-1.jpg',
    category: '上衣',
    subCategory: '针织衫',
    colorCategory: '米色',
    styleTags: ['通勤'],
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-19T10:00:00Z'
  },
  {
    id: 'top-2',
    imageUrl: 'https://example.com/top-2.jpg',
    category: '上衣',
    subCategory: 'T恤',
    colorCategory: '白色',
    styleTags: ['极简'],
    lastWornDate: '2026-04-21',
    wearCount: 3,
    createdAt: '2026-04-19T10:01:00Z'
  },
  {
    id: 'bottom-1',
    imageUrl: 'https://example.com/bottom-1.jpg',
    category: '裤装',
    subCategory: '西裤',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    lastWornDate: null,
    wearCount: 1,
    createdAt: '2026-04-19T10:02:00Z'
  },
  {
    id: 'bottom-2',
    imageUrl: 'https://example.com/bottom-2.jpg',
    category: '裙装',
    subCategory: '半裙',
    colorCategory: '灰色',
    styleTags: ['极简'],
    lastWornDate: '2026-04-20',
    wearCount: 2,
    createdAt: '2026-04-19T10:03:00Z'
  },
  {
    id: 'dress-1',
    imageUrl: 'https://example.com/dress-1.jpg',
    category: '连衣裙',
    subCategory: '针织连衣裙',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    lastWornDate: '2026-04-18',
    wearCount: 4,
    createdAt: '2026-04-19T10:04:00Z'
  },
  {
    id: 'outer-1',
    imageUrl: 'https://example.com/outer-1.jpg',
    category: '外套',
    subCategory: '西装外套',
    colorCategory: '藏蓝',
    styleTags: ['通勤'],
    lastWornDate: '2026-04-15',
    wearCount: 1,
    createdAt: '2026-04-19T10:05:00Z'
  }
]

describe('generateTodayRecommendations', () => {
  it('returns 3 valid recommendations without weather', () => {
    const recommendations = generateTodayRecommendations(items, null)

    expect(recommendations).toHaveLength(3)
    expect(recommendations[0]?.reason).toBeTruthy()
    expect(
      recommendations.every((recommendation) => recommendation.top || recommendation.dress)
    ).toBe(true)
  })

  it('explains same-family and neutral-anchor color logic in more product-like language', () => {
    const sameFamilyRecommendations = generateTodayRecommendations(
      [
        {
          id: 'top-blue',
          imageUrl: 'https://example.com/top-blue.jpg',
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '浅蓝色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-navy',
          imageUrl: 'https://example.com/bottom-navy.jpg',
          category: '下装',
          subCategory: '西裤',
          colorCategory: '藏蓝色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'top-white',
          imageUrl: 'https://example.com/top-white.jpg',
          category: '上装',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-21',
          wearCount: 2,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'bottom-black',
          imageUrl: 'https://example.com/bottom-black.jpg',
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-20',
          wearCount: 1,
          createdAt: '2026-04-19T10:03:00Z'
        }
      ],
      null
    )

    const neutralAnchorRecommendations = generateTodayRecommendations(
      [
        {
          id: 'top-red',
          imageUrl: 'https://example.com/top-red.jpg',
          category: '上装',
          subCategory: '针织衫',
          colorCategory: '红色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-21',
          wearCount: 3,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-black',
          imageUrl: 'https://example.com/bottom-black.jpg',
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      null
    )

    expect(sameFamilyRecommendations.some((recommendation) => recommendation.reason.includes('同色系深浅搭配'))).toBe(true)
    expect(neutralAnchorRecommendations.some((recommendation) => recommendation.reason.includes('用基础色做主轴'))).toBe(true)
    expect(neutralAnchorRecommendations.some((recommendation) => recommendation.reason.includes('把亮色控制在一处'))).toBe(true)
  })

  it('adds outer layers in cold weather when available', () => {
    const recommendations = generateTodayRecommendations({
      items,
      weather: {
        city: 'Shanghai',
        temperatureC: 7,
        conditionLabel: 'light rain',
        isWarm: false,
        isCold: true
      },
      preferenceState: resetRecommendationPreferences()
    })

    expect(recommendations.some((recommendation) => recommendation.outerLayer)).toBe(true)
  })

  it('adds shoes, bag, accessories, confidence, and component scores when available', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items: [
        ...items,
        {
          id: 'shoes-1',
          imageUrl: 'https://example.com/shoes-1.jpg',
          category: '鞋子',
          subCategory: '乐福鞋',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:06:00Z'
        },
        {
          id: 'bag-1',
          imageUrl: 'https://example.com/bag-1.jpg',
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:07:00Z'
        },
        {
          id: 'accessory-1',
          imageUrl: 'https://example.com/accessory-1.jpg',
          category: '配饰',
          subCategory: '腰带',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:08:00Z'
        }
      ],
      weather: null,
      preferenceState: {
        ...preferenceState,
        profile: {
          ...preferenceState.profile,
          slotPreference: {
            ...preferenceState.profile.slotPreference,
            accessories: true
          }
        }
      }
    })

    const firstRecommendation = recommendations[0]

    expect(firstRecommendation?.shoes?.id).toBe('shoes-1')
    expect(firstRecommendation?.bag?.id).toBe('bag-1')
    expect(firstRecommendation?.accessories?.[0]?.id).toBe('accessory-1')
    expect(firstRecommendation?.missingSlots).toEqual([])
    expect(firstRecommendation?.confidence).toBeGreaterThan(70)
    expect(firstRecommendation?.componentScores?.completeness).toBe(100)
    expect(firstRecommendation?.componentScores?.colorHarmony).toBeGreaterThanOrEqual(0)
    expect(firstRecommendation?.componentScores?.colorHarmony).toBeLessThanOrEqual(100)
    expect(firstRecommendation?.mode === 'separates' || firstRecommendation?.mode === 'onePiece').toBe(true)
  })

  it('keeps recommendations when shoes or bag are missing and lowers completeness', () => {
    const recommendations = generateTodayRecommendations(
      [
        {
          id: 'top-only-color',
          imageUrl: null,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-only-color',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      null
    )

    expect(recommendations[0]?.top?.id).toBe('top-only-color')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-only-color')
    expect(recommendations[0]?.missingSlots).toEqual(expect.arrayContaining(['shoes', 'bag']))
    expect(recommendations[0]?.componentScores?.completeness).toBeLessThan(100)
    expect(recommendations[0]?.confidence).toBeLessThan(90)
  })

  it('uses final weights to change candidate ordering', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-tonal',
          imageUrl: null,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '浅蓝色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-21',
          wearCount: 5,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-tonal',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '藏蓝色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-21',
          wearCount: 5,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'top-clash',
          imageUrl: null,
          category: '上装',
          subCategory: '针织衫',
          colorCategory: '红色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'bottom-clash',
          imageUrl: null,
          category: '下装',
          subCategory: '长裙',
          colorCategory: '绿色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:03:00Z'
        },
        {
          id: 'shoes-basic',
          imageUrl: null,
          category: '鞋履',
          subCategory: '休闲鞋',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:04:00Z'
        },
        {
          id: 'bag-basic',
          imageUrl: null,
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:05:00Z'
        }
      ],
      weather: null,
      preferenceState: {
        ...preferenceState,
        finalWeights: {
          colorHarmony: 0.86,
          silhouetteBalance: 0.02,
          layering: 0.02,
          focalPoint: 0.02,
          sceneFit: 0.02,
          weatherComfort: 0.02,
          completeness: 0.02,
          freshness: 0.02
        }
      }
    })

    expect(recommendations[0]?.top?.id).toBe('top-tonal')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-tonal')
  })

  it('falls back to single-item recommendations when the closet lacks full outfits', () => {
    const recommendations = generateTodayRecommendations(
      [
        {
          id: 'top-only-1',
          imageUrl: 'https://example.com/top-only-1.jpg',
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'top-only-2',
          imageUrl: 'https://example.com/top-only-2.jpg',
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '蓝色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-21',
          wearCount: 2,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      null
    )

    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((recommendation) => recommendation.top && !recommendation.bottom && !recommendation.dress)).toBe(
      true
    )
    expect(recommendations.some((recommendation) => recommendation.reason.includes('先用已有单品起一套思路'))).toBe(true)
    expect(recommendations.some((recommendation) => recommendation.reason.includes('适合换一套思路'))).toBe(true)
  })

  it('prioritizes items that have not been worn recently', () => {
    const recommendations = generateTodayRecommendations(
      [
        {
          id: 'top-fresh',
          imageUrl: 'https://example.com/top-fresh.jpg',
          category: '上衣',
          subCategory: '白T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'top-recent',
          imageUrl: 'https://example.com/top-recent.jpg',
          category: '上衣',
          subCategory: '针织衫',
          colorCategory: '灰色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-21',
          wearCount: 5,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'bottom-fresh',
          imageUrl: 'https://example.com/bottom-fresh.jpg',
          category: '裤装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:02:00Z'
        }
      ],
      null
    )

    expect(recommendations[0]?.top?.id).toBe('top-fresh')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-fresh')
  })

  it('returns a visibly different batch when offset increases', () => {
    const firstBatch = generateTodayRecommendations(items, null, 0)
    const secondBatch = generateTodayRecommendations(items, null, 1)

    expect(firstBatch).toHaveLength(3)
    expect(secondBatch).toHaveLength(3)
    expect(secondBatch.map((item) => item.id)).not.toEqual(firstBatch.map((item) => item.id))
  })
})
