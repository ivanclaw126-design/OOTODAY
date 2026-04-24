import { describe, expect, it } from 'vitest'
import { buildClosetInsights } from '@/lib/closet/build-closet-insights'
import { normalizeClosetAlgorithmMeta, normalizeClosetFields } from '@/lib/closet/taxonomy'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { DEMO_WARDROBE_BRAND, DEMO_WARDROBE_ITEMS, DEMO_WARDROBE_MEN_ITEMS } from '@/lib/demo/demo-wardrobe'
import { analyzePurchaseCandidate } from '@/lib/shop/analyze-purchase-candidate'
import type { ShopCandidateItem } from '@/lib/shop/types'
import { buildTravelPackingPlan } from '@/lib/travel/build-travel-packing-plan'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'

function toClosetItem(item: (typeof DEMO_WARDROBE_ITEMS)[number], index: number): ClosetItemCardData {
  return {
    id: item.slug,
    imageUrl: `/demo-wardrobe/${item.slug}.svg`,
    imageFlipped: false,
    imageOriginalUrl: null,
    imageRotationQuarterTurns: 0,
    imageRestoreExpiresAt: null,
    canRestoreOriginal: false,
    category: item.category,
    subCategory: item.subCategory,
    colorCategory: item.colorCategory,
    styleTags: item.styleTags,
    purchasePrice: item.purchasePrice,
    purchaseYear: item.purchaseYear,
    itemCondition: item.itemCondition,
    algorithmMeta: item.algorithmMeta,
    lastWornDate: item.lastWornDate,
    wearCount: item.wearCount,
    createdAt: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
  }
}

const closetItems = DEMO_WARDROBE_ITEMS.map(toClosetItem)
const mensClosetItems = DEMO_WARDROBE_MEN_ITEMS.map(toClosetItem)

describe('demo wardrobe manifest', () => {
  it('contains the planned 48 pre-labeled items', () => {
    expect(DEMO_WARDROBE_BRAND).toBe('OOTODAY Demo')
    expect(DEMO_WARDROBE_ITEMS).toHaveLength(48)
    expect(countByCategory()).toEqual({
      上装: 12,
      下装: 8,
      '连体/全身装': 4,
      外层: 8,
      鞋履: 6,
      包袋: 4,
      配饰: 6
    })
  })

  it('contains the planned 46 menswear pre-labeled items', () => {
    expect(DEMO_WARDROBE_MEN_ITEMS).toHaveLength(46)
    expect(countByCategory(DEMO_WARDROBE_MEN_ITEMS)).toEqual({
      上装: 15,
      下装: 8,
      外层: 7,
      鞋履: 6,
      包袋: 3,
      配饰: 7
    })
  })

  it('uses normalized closet fields and full algorithm metadata', () => {
    for (const item of DEMO_WARDROBE_ITEMS) {
      expect(item.slug).toMatch(/^[a-z0-9-]+$/)
      expect(item.styleTags.length).toBeGreaterThanOrEqual(3)
      expect(item.seasonTags.length).toBeGreaterThanOrEqual(1)
      expect(item.purchasePrice).toBeGreaterThan(0)
      expect(item.purchaseYear).toMatch(/^20\d{2}$/)
      expect(item.itemCondition).toBeTruthy()

      const normalized = normalizeClosetFields({
        category: item.category,
        subCategory: item.subCategory,
        colorCategory: item.colorCategory
      })
      expect(normalized).toEqual({
        category: item.category,
        subCategory: item.subCategory,
        colorCategory: item.colorCategory
      })

      const normalizedMeta = normalizeClosetAlgorithmMeta(item.algorithmMeta, {
        category: item.category,
        subCategory: item.subCategory,
        styleTags: item.styleTags
      })
      expect(normalizedMeta.slot).toBe(item.algorithmMeta.slot)
      expect(normalizedMeta.layerRole).toBe(item.algorithmMeta.layerRole)
      expect(normalizedMeta.fabricWeight).toBe(item.algorithmMeta.fabricWeight)
      expect(normalizedMeta.pattern).toBe(item.algorithmMeta.pattern)
    }

    for (const item of DEMO_WARDROBE_MEN_ITEMS) {
      expect(item.slug).toMatch(/^[a-z0-9-]+$/)
      expect(item.styleTags.length).toBeGreaterThanOrEqual(3)
      expect(item.seasonTags.length).toBeGreaterThanOrEqual(1)
      expect(item.purchasePrice).toBeGreaterThan(0)
      expect(item.purchaseYear).toMatch(/^20\d{2}$/)
      expect(item.itemCondition).toBeTruthy()

      const normalized = normalizeClosetFields({
        category: item.category,
        subCategory: item.subCategory,
        colorCategory: item.colorCategory
      })
      expect(normalized).toEqual({
        category: item.category,
        subCategory: item.subCategory,
        colorCategory: item.colorCategory
      })

      const normalizedMeta = normalizeClosetAlgorithmMeta(item.algorithmMeta, {
        category: item.category,
        subCategory: item.subCategory,
        styleTags: item.styleTags
      })
      expect(normalizedMeta.slot).toBe(item.algorithmMeta.slot)
      expect(normalizedMeta.layerRole).toBe(item.algorithmMeta.layerRole)
      expect(normalizedMeta.fabricWeight).toBe(item.algorithmMeta.fabricWeight)
      expect(normalizedMeta.pattern).toBe(item.algorithmMeta.pattern)
    }
  })

  it('supports Today recommendations, Closet idle review, Shop duplicate risk, and Travel packing', () => {
    const recommendations = generateTodayRecommendations({
      items: closetItems,
      weather: {
        city: '上海',
        temperatureC: 16,
        conditionLabel: '多云',
        isWarm: false,
        isCold: false
      },
      offset: 0
    })
    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((recommendation) => recommendation.missingSlots.length === 0)).toBe(true)

    const insights = buildClosetInsights(closetItems, new Date('2026-04-25T00:00:00.000Z'))
    expect(insights.idleItems.map((item) => item.label).join(' ')).toMatch(/高跟鞋|短裙|帽子/)
    expect(insights.missingBasics).toHaveLength(0)

    const duplicateBlazer: ShopCandidateItem = {
      category: '外层',
      subCategory: '西装外套',
      colorCategory: '黑色',
      styleTags: ['通勤', '正式', '基础'],
      sourceTitle: '第三件黑色通勤西装外套',
      imageUrl: null,
      sourceUrl: null
    }
    const shopAnalysis = analyzePurchaseCandidate(duplicateBlazer, closetItems)
    expect(shopAnalysis.duplicateRisk).toBe('high')
    expect(shopAnalysis.recommendation).toBe('skip')

    const travelPlan = buildTravelPackingPlan({
      destinationCity: '东京',
      days: 5,
      scenes: ['通勤', '休闲', '户外'],
      items: closetItems,
      weather: {
        city: '东京',
        temperatureC: 12,
        conditionLabel: '小雨',
        isWarm: false,
        isCold: true
      }
    })
    expect(travelPlan.entries.map((entry) => entry.slot)).toEqual(
      expect.arrayContaining(['tops', 'bottoms', 'outerwear', 'formalShoes', 'comfortShoes', 'bags'])
    )
    expect(travelPlan.missingHints).toHaveLength(0)
  })

  it('supports the menswear demo closet across Today and Travel', () => {
    const recommendations = generateTodayRecommendations({
      items: mensClosetItems,
      weather: {
        city: '上海',
        temperatureC: 18,
        conditionLabel: '多云',
        isWarm: false,
        isCold: false
      },
      offset: 0
    })
    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((recommendation) => recommendation.missingSlots.length === 0)).toBe(true)

    const travelPlan = buildTravelPackingPlan({
      destinationCity: '东京',
      days: 5,
      scenes: ['通勤', '休闲', '户外'],
      items: mensClosetItems,
      weather: {
        city: '东京',
        temperatureC: 12,
        conditionLabel: '小雨',
        isWarm: false,
        isCold: true
      }
    })
    expect(travelPlan.entries.map((entry) => entry.slot)).toEqual(
      expect.arrayContaining(['tops', 'bottoms', 'outerwear', 'formalShoes', 'comfortShoes', 'bags'])
    )
    expect(travelPlan.missingHints).toHaveLength(0)
  })
})

function countByCategory(items = DEMO_WARDROBE_ITEMS) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + 1
    return counts
  }, {})
}
