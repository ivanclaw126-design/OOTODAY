import { describe, expect, it } from 'vitest'
import { matchClosetToInspiration } from '@/lib/inspiration/match-closet-to-inspiration'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import type { RecommendationPreferenceState } from '@/lib/recommendation/preference-types'

function preferenceState(overrides: Partial<RecommendationPreferenceState> = {}): RecommendationPreferenceState {
  const { profile: profileOverride, ...stateOverrides } = overrides

  return {
    version: 1,
    source: 'questionnaire',
    defaultWeights: DEFAULT_RECOMMENDATION_WEIGHTS,
    questionnaireDelta: {},
    ratingDelta: {},
    finalWeights: DEFAULT_RECOMMENDATION_WEIGHTS,
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    ...stateOverrides,
    profile: {
      ...DEFAULT_PREFERENCE_PROFILE,
      ...profileOverride,
      colorPreference: {
        ...DEFAULT_PREFERENCE_PROFILE.colorPreference,
        ...profileOverride?.colorPreference
      },
      layeringPreference: {
        ...DEFAULT_PREFERENCE_PROFILE.layeringPreference,
        ...profileOverride?.layeringPreference
      },
      practicalityPreference: {
        ...DEFAULT_PREFERENCE_PROFILE.practicalityPreference,
        ...profileOverride?.practicalityPreference
      },
      slotPreference: {
        ...DEFAULT_PREFERENCE_PROFILE.slotPreference,
        ...profileOverride?.slotPreference
      },
      exploration: {
        ...DEFAULT_PREFERENCE_PROFILE.exploration,
        ...profileOverride?.exploration
      }
    }
  }
}

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
            silhouette: ['短款', '硬挺'],
            layerRole: 'outer',
            importance: 5,
            styleTags: ['通勤', '极简']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: []
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
    expect(matches[0]?.matchReason).toContain('同类替代')
    expect(matches[0]?.substituteSuggestion).toBeNull()
    expect(matches[0]?.scoreBreakdown?.categoryScore).toBeCloseTo(0.35)
    expect(matches[0]?.scoreBreakdown?.total).toBeGreaterThan(0.7)
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
            silhouette: ['小面积', '亮点'],
            layerRole: 'statement',
            importance: 5,
            styleTags: ['亮点'],
            alternatives: ['红色针织衫', '红色包袋']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: []
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
    expect(matches[0]?.matchReason).toContain('公式替代')
    expect(matches[0]?.substituteSuggestion).toContain('红色针织衫')
    expect(matches[0]?.scoreBreakdown?.matchType).toBe('formulaSubstitute')
  })

  it('uses silhouette and color to substitute a long dark coat with a long dark blazer', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        colorFormula: '深色主线',
        silhouetteFormula: '长线条外层 + 窄下装',
        layeringFormula: '外长内短',
        focalPoint: '深色长外套',
        keyItems: [
          {
            id: 'item-1',
            label: '深色长外套',
            category: '大衣',
            slot: 'outerLayer',
            colorHint: '黑色',
            silhouette: ['长线条', '长外套'],
            layerRole: 'outer',
            importance: 5,
            styleTags: ['通勤'],
            alternatives: ['深色长西装外套']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: []
      },
      [
        {
          id: 'long-blazer',
          imageUrl: null,
          category: '外套',
          subCategory: '长西装外套',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        }
      ]
    )

    expect(matches[0]?.matchedItems.map((item) => item.id)).toEqual(['long-blazer'])
    expect(matches[0]?.substituteSuggestion).toContain('深色长西装外套')
    expect(matches[0]?.scoreBreakdown?.silhouetteScore).toBeGreaterThan(0)
  })

  it('low color-risk preferences lower bold color substitutes in ranking', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        colorFormula: '红色重点',
        silhouetteFormula: '基础轮廓',
        layeringFormula: '单层',
        focalPoint: '红色上衣',
        keyItems: [
          {
            id: 'item-1',
            label: '红色亮色上衣',
            category: '上装',
            slot: 'top',
            colorHint: '红色',
            silhouette: [],
            layerRole: 'base',
            importance: 5,
            styleTags: ['通勤'],
            alternatives: ['低饱和基础色上衣']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: []
      },
      [
        {
          id: 'red-top',
          imageUrl: null,
          category: '上装',
          subCategory: '针织上衣',
          colorCategory: '红色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        },
        {
          id: 'black-top',
          imageUrl: null,
          category: '上装',
          subCategory: '针织上衣',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        }
      ],
      preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          colorPreference: {
            saturation: 'low',
            contrast: 'low',
            palette: 'neutral',
            accentTolerance: 0
          }
        }
      })
    )

    expect(matches[0]?.matchedItems.map((item) => item.id)).toEqual(['black-top', 'red-top'])
    expect(matches[0]?.preferenceNote).toContain('低饱和')
  })

  it('high layering complexity makes layered substitutes easier to accept', () => {
    const breakdown = {
      summary: 'summary',
      scene: 'scene',
      vibe: 'vibe',
      colorFormula: '黑色主线',
      silhouetteFormula: '外长内短',
      layeringFormula: '多层外搭',
      focalPoint: '外层',
      keyItems: [
        {
          id: 'item-1',
          label: '外搭层次',
          category: '外套',
          slot: 'outerLayer' as const,
          colorHint: '黑色',
          silhouette: ['长线条'],
          layerRole: 'outer' as const,
          importance: 4 as const,
          styleTags: ['通勤']
        }
      ],
      stylingTips: [],
      colorStrategyNotes: []
    }
    const closetItems = [
      {
        id: 'long-coat',
        imageUrl: null,
        category: '外套',
        subCategory: '长外套',
        colorCategory: '黑色',
        styleTags: ['通勤'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-22T00:00:00Z'
      }
    ]
    const high = matchClosetToInspiration(
      breakdown,
      closetItems,
      preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          layeringPreference: {
            complexity: 3,
            allowNonWeatherOuterwear: true
          }
        }
      })
    )
    const low = matchClosetToInspiration(
      breakdown,
      closetItems,
      preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          layeringPreference: {
            complexity: 0,
            allowNonWeatherOuterwear: false
          }
        }
      })
    )

    expect(high[0]?.scoreBreakdown?.total).toBeGreaterThan(low[0]?.scoreBreakdown?.total ?? 0)
    expect(high[0]?.preferenceNote).toContain('叠穿复杂度偏好较高')
  })

  it('hardAvoids block disliked styles from daily remix matches', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        colorFormula: '黑色',
        silhouetteFormula: '硬挺短外套',
        layeringFormula: '外层',
        focalPoint: '皮衣',
        keyItems: [
          {
            id: 'item-1',
            label: '黑色皮衣',
            category: '外套',
            slot: 'outerLayer',
            colorHint: '黑色',
            silhouette: ['硬挺'],
            layerRole: 'outer',
            importance: 5,
            styleTags: ['皮衣']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: []
      },
      [
        {
          id: 'leather-jacket',
          imageUrl: null,
          category: '外套',
          subCategory: '皮衣',
          colorCategory: '黑色',
          styleTags: ['皮衣'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-22T00:00:00Z'
        }
      ],
      preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          hardAvoids: ['皮衣']
        }
      })
    )

    expect(matches[0]?.matchedItems).toHaveLength(0)
    expect(matches[0]?.matchReason).toContain('hard avoids')
    expect(matches[0]?.scoreBreakdown?.blockedByHardAvoid).toBe(true)
  })

  it('still allows medium-distance inspiration substitutes', () => {
    const matches = matchClosetToInspiration(
      {
        summary: 'summary',
        scene: 'scene',
        vibe: 'vibe',
        colorFormula: '红色视觉中心',
        silhouetteFormula: '轻松基础轮廓',
        layeringFormula: '单层',
        focalPoint: '红色围巾',
        keyItems: [
          {
            id: 'item-1',
            label: '红色围巾',
            category: '配饰',
            slot: 'accessory',
            colorHint: '红色',
            silhouette: ['亮点'],
            layerRole: 'statement',
            importance: 5,
            styleTags: ['亮点']
          }
        ],
        stylingTips: [],
        colorStrategyNotes: []
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
        }
      ],
      preferenceState()
    )

    expect(matches[0]?.matchedItems.map((item) => item.id)).toEqual(['red-knit'])
    expect(matches[0]?.matchReason).toContain('适度偏离')
  })
})
