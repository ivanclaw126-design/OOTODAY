import { describe, expect, it } from 'vitest'
import { matchClosetToInspiration } from '@/lib/inspiration/match-closet-to-inspiration'

describe('matchClosetToInspiration', () => {
  it('returns same-category closet matches ordered by style similarity', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        colorFormula: '黑色主色 + 白色提亮',
        silhouetteFormula: '短外套 + 直筒下装',
        layeringFormula: '外短内长',
        focalPoint: '短西装外套',
        keyItems: [
          {
            id: 'item-1',
            label: '通勤西装',
            category: '外套',
            slot: 'outerLayer',
            colorHint: '黑色',
            silhouette: '短款硬挺',
            layerRole: 'outer',
            importance: 'high',
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
    expect(matches[0]?.matchReason).toContain('类别/slot')
    expect(matches[0]?.substituteSuggestion).toBeNull()
  })

  it('suggests formula-based substitutes when the closet has no same-category item', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        colorFormula: '红色视觉中心 + 黑色托底',
        silhouetteFormula: '基础轮廓 + 小面积亮点',
        layeringFormula: '单层穿搭，用配饰做重点',
        focalPoint: '红色围巾',
        keyItems: [
          {
            id: 'item-1',
            label: '红色围巾',
            category: '配饰',
            slot: 'accessory',
            colorHint: '红色',
            silhouette: '小面积亮点',
            layerRole: 'accent',
            importance: 'high',
            styleTags: ['亮点'],
            alternatives: ['红色针织衫', '红色包袋']
          }
        ],
        stylingTips: []
      },
      [
        {
          id: 'red-knit',
          imageUrl: null,
          category: '上衣',
          subCategory: '针织衫',
          colorCategory: '红色',
          styleTags: ['亮点'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        },
        {
          id: 'black-pants',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        }
      ]
    )

    expect(matches[0]?.matchedItems.map((item) => item.id)).toEqual(['red-knit'])
    expect(matches[0]?.matchReason).toContain('没有同类单品')
    expect(matches[0]?.substituteSuggestion).toContain('红色针织衫')
  })
})
