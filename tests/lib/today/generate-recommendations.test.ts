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
    createdAt: '2026-04-19T10:00:00Z'
  },
  {
    id: 'top-2',
    imageUrl: 'https://example.com/top-2.jpg',
    category: '上衣',
    subCategory: 'T恤',
    colorCategory: '白色',
    styleTags: ['极简'],
    createdAt: '2026-04-19T10:01:00Z'
  },
  {
    id: 'bottom-1',
    imageUrl: 'https://example.com/bottom-1.jpg',
    category: '裤装',
    subCategory: '西裤',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    createdAt: '2026-04-19T10:02:00Z'
  },
  {
    id: 'bottom-2',
    imageUrl: 'https://example.com/bottom-2.jpg',
    category: '裙装',
    subCategory: '半裙',
    colorCategory: '灰色',
    styleTags: ['极简'],
    createdAt: '2026-04-19T10:03:00Z'
  },
  {
    id: 'dress-1',
    imageUrl: 'https://example.com/dress-1.jpg',
    category: '连衣裙',
    subCategory: '针织连衣裙',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    createdAt: '2026-04-19T10:04:00Z'
  },
  {
    id: 'outer-1',
    imageUrl: 'https://example.com/outer-1.jpg',
    category: '外套',
    subCategory: '西装外套',
    colorCategory: '藏蓝',
    styleTags: ['通勤'],
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
})
