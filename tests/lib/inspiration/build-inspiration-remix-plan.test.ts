import { describe, expect, it } from 'vitest'
import { buildInspirationRemixPlan } from '@/lib/inspiration/build-inspiration-remix-plan'

describe('buildInspirationRemixPlan', () => {
  it('builds wearable steps and missing-item gaps from closet matches', () => {
    const result = buildInspirationRemixPlan(
      {
        summary: '利落通勤风',
        scene: '通勤',
        vibe: '克制',
        keyItems: [
          {
            id: 'item-1',
            label: '西装外套',
            category: '外套',
            colorHint: '黑色',
            styleTags: ['通勤']
          },
          {
            id: 'item-2',
            label: '直筒裤',
            category: '裤装',
            colorHint: '灰色',
            styleTags: ['极简']
          }
        ],
        stylingTips: []
      },
      [
        {
          inspirationItem: {
            id: 'item-1',
            label: '西装外套',
            category: '外套',
            colorHint: '黑色',
            styleTags: ['通勤']
          },
          matchedItems: [
            {
              id: 'coat-1',
              imageUrl: null,
              category: '外套',
              subCategory: '西装外套',
              colorCategory: '黑色',
              styleTags: ['通勤'],
              lastWornDate: null,
              wearCount: 1,
              createdAt: '2026-04-22T00:00:00Z'
            }
          ]
        },
        {
          inspirationItem: {
            id: 'item-2',
            label: '直筒裤',
            category: '裤装',
            colorHint: '灰色',
            styleTags: ['极简']
          },
          matchedItems: []
        }
      ]
    )

    expect(result.matchedCount).toBe(1)
    expect(result.totalCount).toBe(2)
    expect(result.coverageLabel).toBe('已经能穿出七成感觉')
    expect(result.steps[0]?.note).toContain('黑色 西装外套')
    expect(result.steps[1]?.note).toContain('待补位单品')
    expect(result.missingItems).toHaveLength(1)
    expect(result.missingItems[0]?.label).toBe('直筒裤')
  })
})
