import { describe, expect, it } from 'vitest'
import { matchClosetToInspiration } from '@/lib/inspiration/match-closet-to-inspiration'

describe('matchClosetToInspiration', () => {
  it('returns same-category closet matches ordered by style similarity', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        keyItems: [
          {
            id: 'item-1',
            label: '通勤西装',
            category: '外套',
            colorHint: '黑色',
            styleTags: ['通勤', '极简']
          }
        ],
        stylingTips: []
      },
      [
        {
          id: 'coat-1',
          imageUrl: null,
          category: '外套',
          subCategory: '西装外套',
          colorCategory: '黑色',
          styleTags: ['通勤', '极简'],
          lastWornDate: null,
          wearCount: 3,
          createdAt: '2026-04-22T00:00:00Z'
        },
        {
          id: 'coat-2',
          imageUrl: null,
          category: '外套',
          subCategory: '牛仔外套',
          colorCategory: '蓝色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        }
      ]
    )

    expect(matches[0]?.matchedItems.map((item) => item.id)).toEqual(['coat-1', 'coat-2'])
  })
})
