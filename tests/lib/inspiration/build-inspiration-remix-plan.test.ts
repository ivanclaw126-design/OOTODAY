import { describe, expect, it } from 'vitest'
import { buildInspirationRemixPlan } from '@/lib/inspiration/build-inspiration-remix-plan'

describe('buildInspirationRemixPlan', () => {
  it('builds wearable steps and missing-item gaps from closet matches', () => {
    const result = buildInspirationRemixPlan(
      {
        summary: '利落通勤风',
        scene: '通勤',
        vibe: '克制',
        colorFormula: '黑灰基础色',
        silhouetteFormula: '短外套 + 直筒下装',
        layeringFormula: '外短内长',
        focalPoint: '黑色西装外套',
        keyItems: [
          {
            id: 'item-1',
            label: '西装外套',
            category: '外套',
            slot: 'outerLayer',
            colorHint: '黑色',
            silhouette: ['短款', '硬挺'],
            layerRole: 'outer',
            importance: 5,
            styleTags: ['通勤']
          },
          {
            id: 'item-2',
            label: '直筒裤',
            category: '裤装',
            slot: 'bottom',
            colorHint: '灰色',
            silhouette: ['直筒'],
            layerRole: 'base',
            importance: 5,
            styleTags: ['极简']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: ['这套灵感有基础色托底，所以整体看起来更稳。']
      },
      [
        {
          inspirationItem: {
            id: 'item-1',
            label: '西装外套',
            category: '外套',
            slot: 'outerLayer',
            colorHint: '黑色',
            silhouette: ['短款', '硬挺'],
            layerRole: 'outer',
            importance: 5,
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
          ],
          matchReason: '同类替代：按类别 35%、slot 15%、颜色 20%、轮廓 15%、风格 10%、层次 5% 加权排序。',
          substituteSuggestion: null,
          scoreBreakdown: {
            total: 0.9,
            categoryScore: 0.35,
            slotScore: 0.15,
            colorScore: 0.2,
            silhouetteScore: 0.15,
            styleScore: 0.0,
            layerRoleScore: 0.05,
            matchType: 'sameCategory'
          }
        },
        {
          inspirationItem: {
            id: 'item-2',
            label: '直筒裤',
            category: '裤装',
            slot: 'bottom',
            colorHint: '灰色',
            silhouette: ['直筒'],
            layerRole: 'base',
            importance: 5,
            styleTags: ['极简']
          },
          matchedItems: [],
          matchReason: '暂时没有能稳定承接“直筒裤”公式角色的单品。',
          substituteSuggestion: '没有同类单品，也没有足够接近的替代；先记住它承担的是“base”角色。'
        }
      ]
    )

    expect(result.matchedCount).toBe(1)
    expect(result.totalCount).toBe(2)
    expect(result.coverageLabel).toContain('已经能穿出七成感觉')
    expect(result.steps[0]?.note).toContain('同类替代')
    expect(result.steps[0]?.note).toContain('黑色 西装外套')
    expect(result.summary).toContain('短外套 + 直筒下装')
    expect(result.summary).toContain('外短内长')
    expect(result.summary).toContain('黑色西装外套')
    expect(result.steps[1]?.note).toContain('base')
    expect(result.missingItems).toHaveLength(1)
    expect(result.missingItems[0]?.label).toBe('直筒裤')
  })
})
