import { describe, expect, it } from 'vitest'
import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  evaluateOutfit,
  filterWeatherSuitableItems,
  getItemWeatherSuitability,
  hasTonalColorRelationship
} from '@/lib/recommendation/outfit-evaluator'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'

function item(overrides: Partial<ClosetItemCardData>): ClosetItemCardData {
  return {
    id: overrides.id ?? 'item',
    imageUrl: null,
    category: overrides.category ?? '上装',
    subCategory: overrides.subCategory ?? 'T恤',
    colorCategory: overrides.colorCategory ?? '白色',
    styleTags: overrides.styleTags ?? ['基础'],
    seasonTags: overrides.seasonTags,
    algorithmMeta: overrides.algorithmMeta,
    lastWornDate: overrides.lastWornDate ?? null,
    wearCount: overrides.wearCount ?? 0,
    createdAt: overrides.createdAt ?? '2026-04-24T00:00:00Z'
  }
}

describe('outfit evaluator', () => {
  it('filters summer shorts and sandals down in 15 degree weather when alternatives exist', () => {
    const weather = {
      city: 'Shanghai',
      temperatureC: 15,
      conditionLabel: '阴',
      isWarm: false,
      isCold: false
    }
    const shorts = item({
      id: 'shorts',
      category: '下装',
      subCategory: '短裤',
      colorCategory: '卡其色',
      seasonTags: ['夏'],
      algorithmMeta: { warmthLevel: 0, length: '短款' }
    })
    const pants = item({
      id: 'pants',
      category: '下装',
      subCategory: '休闲裤',
      colorCategory: '卡其色',
      seasonTags: ['春秋'],
      algorithmMeta: { warmthLevel: 2, length: '长款' }
    })
    const sandals = item({
      id: 'sandals',
      category: '鞋履',
      subCategory: '凉鞋/拖鞋',
      colorCategory: '黑色',
      seasonTags: ['夏'],
      algorithmMeta: { warmthLevel: 0 }
    })
    const sneakers = item({
      id: 'sneakers',
      category: '鞋履',
      subCategory: '运动鞋',
      colorCategory: '白色',
      seasonTags: ['四季'],
      algorithmMeta: { warmthLevel: 2, comfortLevel: 5 }
    })

    expect(getItemWeatherSuitability(shorts, weather)).toBeLessThan(45)
    expect(getItemWeatherSuitability(sandals, weather)).toBeLessThan(45)
    expect(filterWeatherSuitableItems([shorts, pants], weather, 52).map((entry) => entry.id)).toEqual(['pants'])
    expect(filterWeatherSuitableItems([sandals, sneakers], weather, 52).map((entry) => entry.id)).toEqual(['sneakers'])
  })

  it('uses category text as fallback when algorithm fields are missing', () => {
    const weather = {
      city: 'Shanghai',
      temperatureC: 15,
      conditionLabel: '阴',
      isWarm: false,
      isCold: false
    }
    const fallbackShorts = item({
      id: 'fallback-shorts',
      category: '下装',
      subCategory: '短裤',
      colorCategory: '卡其色'
    })
    const fallbackPants = item({
      id: 'fallback-pants',
      category: '下装',
      subCategory: '西裤',
      colorCategory: '黑色'
    })

    expect(getItemWeatherSuitability(fallbackShorts, weather)).toBeLessThan(getItemWeatherSuitability(fallbackPants, weather))
  })

  it('scores a complete cool-weather outfit across every feedback weight key', () => {
    const componentScores = evaluateOutfit(
      {
        top: item({ id: 'top', category: '上装', subCategory: '针织上衣', colorCategory: '浅灰色', algorithmMeta: { warmthLevel: 2, formality: 3 } }),
        bottom: item({ id: 'bottom', category: '下装', subCategory: '西裤', colorCategory: '黑色', algorithmMeta: { warmthLevel: 2, formality: 4 } }),
        outerLayer: item({ id: 'outer', category: '外层', subCategory: '夹克', colorCategory: '深灰色', algorithmMeta: { warmthLevel: 3, layerRole: 'outer' } }),
        shoes: item({ id: 'shoes', category: '鞋履', subCategory: '乐福鞋', colorCategory: '黑色', algorithmMeta: { warmthLevel: 2, formality: 4 } }),
        bag: item({ id: 'bag', category: '包袋', subCategory: '托特包', colorCategory: '深棕色', algorithmMeta: { formality: 4 } }),
        missingSlots: []
      },
      {
        weather: {
          city: 'Shanghai',
          temperatureC: 15,
          conditionLabel: '阴',
          isWarm: false,
          isCold: false
        },
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          preferredScenes: ['work']
        }
      }
    ).componentScores

    expect(Object.keys(componentScores).sort()).toEqual([
      'colorHarmony',
      'completeness',
      'focalPoint',
      'freshness',
      'layering',
      'sceneFit',
      'silhouetteBalance',
      'weatherComfort'
    ])
    expect(componentScores.weatherComfort).toBeGreaterThan(78)
    expect(componentScores.sceneFit).toBeGreaterThan(70)
  })

  it('does not call unrelated neutral clusters tonal same-family', () => {
    expect(hasTonalColorRelationship('浅蓝色', '藏蓝色')).toBe(true)
    expect(hasTonalColorRelationship('黑色', '浅灰色')).toBe(true)
    expect(hasTonalColorRelationship('黑色', '卡其色')).toBe(false)
    expect(hasTonalColorRelationship('灰色', '棕色')).toBe(false)
  })
})
