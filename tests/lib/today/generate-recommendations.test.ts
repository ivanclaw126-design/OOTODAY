import { describe, expect, it } from 'vitest'
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

  it('adds outer layers in cold weather when available', () => {
    const recommendations = generateTodayRecommendations(items, {
      city: 'Shanghai',
      temperatureC: 7,
      conditionLabel: 'light rain',
      isWarm: false,
      isCold: true
    })

    expect(recommendations.some((recommendation) => recommendation.outerLayer)).toBe(true)
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
})
