import { describe, expect, it } from 'vitest'
import { buildTravelPackingPlan } from '@/lib/travel/build-travel-packing-plan'

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
    expect(plan.missingHints).toContain('当前衣橱里没有可打包鞋履，计划仍能生成，但实际出行前需要先补一双能覆盖主要行程的鞋。')
    expect(plan.missingHints).toContain('通勤或正式场景缺少包袋，会影响电脑、证件携带和整套造型完整度。')
    expect(plan.notes.length).toBeGreaterThan(1)
    expect(plan.notes.some((note) => note.includes('基础色占比够高'))).toBe(true)
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
    expect(plan.missingHints).toContain('当前衣橱里没有可打包鞋履，计划仍能生成，但实际出行前需要先补一双能覆盖主要行程的鞋。')
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

    expect(plan.notes.some((note) => note.includes('基础色占比够高'))).toBe(true)
    expect(plan.notes.some((note) => note.includes('只带一处重点色'))).toBe(true)
  })
})
