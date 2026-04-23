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
    expect(plan.missingHints).toEqual([])
    expect(plan.notes.length).toBeGreaterThan(1)
    expect(plan.notes.some((note) => note.includes('基础色占比够高'))).toBe(true)
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
    expect(plan.missingHints).toContain('这趟更适合带一件外层，但当前衣橱里没有可直接打包的外层。')
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
