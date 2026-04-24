import { describe, expect, it } from 'vitest'
import { buildTravelPackingPlan } from '@/lib/travel/build-travel-packing-plan'
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
      }
    }
  }
}

describe('buildTravelPackingPlan', () => {
  it('builds a wardrobe-backed packing plan with hints and notes', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '东京',
      days: 4,
      scenes: ['通勤', '休闲'],
      weather: {
        city: 'Tokyo',
        temperatureC: 10,
        conditionLabel: 'cloudy',
        isWarm: false,
        isCold: true
      },
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-20',
          wearCount: 5,
          createdAt: '2026-03-01T00:00:00Z'
        },
        {
          id: 'top-2',
          imageUrl: null,
          category: '上衣',
          subCategory: '针织衫',
          colorCategory: '灰色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-18',
          wearCount: 3,
          createdAt: '2026-03-02T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-19',
          wearCount: 4,
          createdAt: '2026-03-03T00:00:00Z'
        },
        {
          id: 'outer-1',
          imageUrl: null,
          category: '外层',
          subCategory: '西装外套',
          colorCategory: '藏蓝',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-17',
          wearCount: 2,
          createdAt: '2026-03-04T00:00:00Z'
        }
      ]
    })

    expect(plan.destinationCity).toBe('东京')
    expect(plan.suggestedOutfitCount).toBe(1)
    expect(plan.entries.map((entry) => entry.categoryLabel)).toEqual(['上衣', '下装', '外层'])
    expect(plan.dailyPlan).toHaveLength(4)
    expect(plan.dailyPlan[0]?.dayLabel).toBe('第 1 天')
    expect(plan.missingHints).toContain('当前衣橱里没有可打包鞋履，计划仍能生成，但出行前需要补一双能覆盖主要行程的鞋。')
    expect(plan.missingHints).toContain('通勤或正式场景缺少包袋，会影响电脑、证件携带和整套造型完整度。')
    expect(plan.notes.length).toBeGreaterThan(1)
    expect(plan.notes.some((note) => note.includes('基础色托底'))).toBe(true)
  })

  it('selects formal, comfortable, backup shoes and a bag by travel scene', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '伦敦',
      days: 5,
      scenes: ['通勤', '户外'],
      weather: {
        city: 'London',
        temperatureC: 8,
        conditionLabel: 'rain',
        isWarm: false,
        isCold: true
      },
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 3,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 3,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'outer-1',
          imageUrl: null,
          category: '外层',
          subCategory: '风衣',
          colorCategory: '卡其色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'shoe-formal',
          imageUrl: null,
          category: '鞋履',
          subCategory: '乐福鞋',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 4,
          createdAt: '2026-04-03T00:00:00Z'
        },
        {
          id: 'shoe-comfort',
          imageUrl: null,
          category: '鞋履',
          subCategory: '运动鞋',
          colorCategory: '白色',
          styleTags: ['舒适'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-04T00:00:00Z'
        },
        {
          id: 'shoe-backup',
          imageUrl: null,
          category: '鞋履',
          subCategory: '靴子',
          colorCategory: '棕色',
          styleTags: ['防雨'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-05T00:00:00Z'
        },
        {
          id: 'bag-1',
          imageUrl: null,
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-06T00:00:00Z'
        }
      ]
    })

    expect(plan.entries.map((entry) => entry.categoryLabel)).toEqual(['上衣', '下装', '外层', '正式鞋', '舒适鞋', '备用鞋', '包袋'])
    expect(plan.entries.find((entry) => entry.categoryLabel === '正式鞋')?.selectedItems.map((item) => item.id)).toEqual(['shoe-formal'])
    expect(plan.entries.find((entry) => entry.categoryLabel === '舒适鞋')?.selectedItems.map((item) => item.id)).toEqual(['shoe-comfort'])
    expect(plan.entries.find((entry) => entry.categoryLabel === '备用鞋')?.selectedItems.map((item) => item.id)).toEqual(['shoe-backup'])
    expect(plan.entries.find((entry) => entry.categoryLabel === '包袋')?.selectedItems.map((item) => item.id)).toEqual(['bag-1'])
    expect(plan.dailyPlan[0]?.shoeSummary).toContain('乐福鞋')
    expect(plan.dailyPlan[1]?.shoeSummary).toContain('运动鞋')
    expect(plan.dailyPlan[0]?.bagSummary).toContain('托特包')
    expect(plan.missingHints.some((hint) => hint.includes('缺少包袋'))).toBe(false)
    expect(plan.missingHints.some((hint) => hint.includes('没有可打包鞋履'))).toBe(false)
    expect(plan.notes).toContain('户外、步行或长途旅行先保住舒适鞋，再考虑造型变化。')
  })

  it('surfaces packing risks when wardrobe coverage is shallow', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '首尔',
      days: 5,
      scenes: ['正式'],
      weather: null,
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        }
      ]
    })

    expect(plan.entries.map((entry) => entry.categoryLabel)).toEqual(['上衣'])
    expect(plan.dailyPlan).toHaveLength(5)
    expect(plan.missingHints).toContain('当前衣橱里缺少稳定下装，这会让旅行搭配明显受限。')
    expect(plan.missingHints).toContain('这趟更适合带一件外层，但当前衣橱里没有可直接打包的外层，冷天或长途温差会更难处理。')
    expect(plan.missingHints).toContain('当前衣橱里没有可打包鞋履，计划仍能生成，但出行前需要补一双能覆盖主要行程的鞋。')
    expect(plan.missingHints).toContain('通勤或正式场景缺少包袋，会影响电脑、证件携带和整套造型完整度。')
  })

  it('uses a mild-weather note when weather exists but is neither hot nor cold', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '上海',
      days: 4,
      scenes: ['通勤', '休闲'],
      weather: {
        city: 'Shanghai Municipality',
        temperatureC: 18,
        conditionLabel: 'moderate rain',
        isWarm: false,
        isCold: false
      },
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        }
      ]
    })

    expect(plan.notes).toContain('目的地温度比较温和，优先带最稳定的基础组合，再用上衣和场景做变化。')
    expect(plan.notes).not.toContain('天气数据暂时不可用，这份清单先按衣橱稳定度和场景覆盖来排。')
  })

  it('does not pack shorts or sandals for 15 degree travel when alternatives exist', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '上海',
      days: 3,
      scenes: ['休闲'],
      weather: {
        city: 'Shanghai',
        temperatureC: 15,
        conditionLabel: '阴',
        isWarm: false,
        isCold: false
      },
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'shorts',
          imageUrl: null,
          category: '下装',
          subCategory: '短裤',
          colorCategory: '卡其色',
          styleTags: ['休闲'],
          seasonTags: ['夏'],
          algorithmMeta: { warmthLevel: 0, length: '短款' },
          lastWornDate: null,
          wearCount: 9,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'pants',
          imageUrl: null,
          category: '下装',
          subCategory: '休闲裤',
          colorCategory: '卡其色',
          styleTags: ['休闲'],
          seasonTags: ['春秋'],
          algorithmMeta: { warmthLevel: 2, length: '长款' },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-03T00:00:00Z'
        },
        {
          id: 'sandals',
          imageUrl: null,
          category: '鞋履',
          subCategory: '凉鞋/拖鞋',
          colorCategory: '黑色',
          styleTags: ['休闲'],
          seasonTags: ['夏'],
          algorithmMeta: { warmthLevel: 0 },
          lastWornDate: null,
          wearCount: 9,
          createdAt: '2026-04-04T00:00:00Z'
        },
        {
          id: 'sneakers',
          imageUrl: null,
          category: '鞋履',
          subCategory: '运动鞋',
          colorCategory: '白色',
          styleTags: ['舒适'],
          algorithmMeta: { warmthLevel: 2, comfortLevel: 5 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-05T00:00:00Z'
        }
      ]
    })

    expect(plan.entries.find((entry) => entry.categoryLabel === '下装')?.selectedItems.map((item) => item.id)).toEqual(['pants'])
    expect(plan.entries.find((entry) => entry.categoryLabel === '舒适鞋')?.selectedItems.map((item) => item.id)).toEqual(['sneakers'])
    expect(plan.dailyPlan.map((day) => day.selectedItems.map((item) => item.id)).flat()).not.toContain('shorts')
    expect(plan.dailyPlan.map((day) => day.selectedItems.map((item) => item.id)).flat()).not.toContain('sandals')
  })

  it('adds color-role based repeat-wear guidance for travel packing', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '香港',
      days: 3,
      scenes: ['休闲'],
      weather: {
        city: 'Hong Kong',
        temperatureC: 24,
        conditionLabel: 'sunny',
        isWarm: true,
        isCold: false
      },
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'top-2',
          imageUrl: null,
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '米色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '短裤',
          colorCategory: '卡其色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-03T00:00:00Z'
        },
        {
          id: 'dress-1',
          imageUrl: null,
          category: '连体/全身装',
          subCategory: '连衣裙',
          colorCategory: '红色',
          styleTags: ['约会'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-04T00:00:00Z'
        }
      ]
    })

    expect(plan.notes.some((note) => note.includes('基础色托底'))).toBe(true)
    expect(plan.notes.some((note) => note.includes('只带一处亮色重点'))).toBe(true)
  })

  it('reduces backup shoes and non-essential bags for light packers', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '伦敦',
      days: 5,
      scenes: ['休闲'],
      weather: null,
      preferenceState: preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          layeringPreference: { complexity: 0, allowNonWeatherOuterwear: false },
          practicalityPreference: { comfortPriority: 3, stylePriority: 1 },
          slotPreference: {
            outerwear: true,
            shoes: true,
            bag: false,
            accessories: false
          }
        }
      }),
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '牛仔裤',
          colorCategory: '蓝色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'shoe-1',
          imageUrl: null,
          category: '鞋履',
          subCategory: '运动鞋',
          colorCategory: '白色',
          styleTags: ['舒适'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'shoe-2',
          imageUrl: null,
          category: '鞋履',
          subCategory: '靴子',
          colorCategory: '黑色',
          styleTags: ['防雨'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'bag-1',
          imageUrl: null,
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-03T00:00:00Z'
        }
      ]
    })

    expect(plan.entries.map((entry) => entry.categoryLabel)).not.toContain('备用鞋')
    expect(plan.entries.map((entry) => entry.categoryLabel)).not.toContain('包袋')
    expect(plan.notes.some((note) => note.includes('轻装出行'))).toBe(true)
    expect(plan.notes.some((note) => note.includes('减少三层组合'))).toBe(true)
  })

  it('keeps shoe and bag slots for complete-styling users', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '巴黎',
      days: 3,
      scenes: ['约会'],
      weather: null,
      preferenceState: preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          practicalityPreference: { comfortPriority: 1, stylePriority: 3 },
          slotPreference: {
            outerwear: true,
            shoes: true,
            bag: true,
            accessories: true
          }
        }
      }),
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['约会'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['约会'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'shoe-1',
          imageUrl: null,
          category: '鞋履',
          subCategory: '乐福鞋',
          colorCategory: '黑色',
          styleTags: ['约会'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'bag-1',
          imageUrl: null,
          category: '包袋',
          subCategory: '单肩包',
          colorCategory: '黑色',
          styleTags: ['约会'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-03T00:00:00Z'
        }
      ]
    })

    expect(plan.entries.map((entry) => entry.categoryLabel)).toEqual(expect.arrayContaining(['备用鞋', '包袋']))
    expect(plan.notes.some((note) => note.includes('完整造型'))).toBe(true)
  })

  it('comfort-first users rank comfortable shoes higher for walking trips', () => {
    const plan = buildTravelPackingPlan({
      destinationCity: '京都',
      days: 4,
      scenes: ['户外'],
      weather: null,
      preferenceState: preferenceState({
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          practicalityPreference: { comfortPriority: 3, stylePriority: 1 }
        }
      }),
      items: [
        {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '短裤',
          colorCategory: '黑色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-01T00:00:00Z'
        },
        {
          id: 'shoe-low-comfort',
          imageUrl: null,
          category: '鞋履',
          subCategory: '乐福鞋',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          algorithmMeta: { comfortLevel: 1 },
          lastWornDate: null,
          wearCount: 9,
          createdAt: '2026-04-02T00:00:00Z'
        },
        {
          id: 'shoe-high-comfort',
          imageUrl: null,
          category: '鞋履',
          subCategory: '运动鞋',
          colorCategory: '白色',
          styleTags: ['舒适'],
          algorithmMeta: { comfortLevel: 5 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-03T00:00:00Z'
        }
      ]
    })

    expect(plan.entries.find((entry) => entry.categoryLabel === '舒适鞋')?.selectedItems[0]?.id).toBe('shoe-high-comfort')
    expect(plan.notes.some((note) => note.includes('更重视舒适度'))).toBe(true)
  })
})
