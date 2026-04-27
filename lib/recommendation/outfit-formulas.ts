import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  isBottomCategory,
  isOnePieceCategory,
  isTopCategory,
  normalizeInput
} from '@/lib/closet/taxonomy'
import type { RecommendationStrategyKey } from '@/lib/recommendation/canonical-types'
import type { PreferenceProfile } from '@/lib/recommendation/preference-types'
import type { TodayWeather } from '@/lib/today/types'

export type OutfitFormulaSlot = 'top' | 'bottom' | 'dress' | 'outerLayer' | 'shoes' | 'bag' | 'accessories'

export type OutfitFormulaConstraint = {
  categories?: string[]
  subCategoryTokens?: string[]
  styleTags?: string[]
  colors?: string[]
  silhouetteTokens?: string[]
  materialTokens?: string[]
}

export type OutfitFormula = {
  id: string
  name: string
  requiredSlots: OutfitFormulaSlot[]
  constraints: Partial<Record<OutfitFormulaSlot, OutfitFormulaConstraint>>
  occasionTags: PreferenceProfile['preferredScenes'][number][]
  seasonTags: string[]
  strategyTags: RecommendationStrategyKey[]
}

export const OUTFIT_FORMULAS: OutfitFormula[] = [
  {
    id: 'work-knit-trouser-loafer',
    name: '针织衫 + 西裤 + 乐福鞋',
    requiredSlots: ['top', 'bottom'],
    constraints: {
      top: { subCategoryTokens: ['针织', '毛衣', '开衫'], styleTags: ['通勤', '基础'] },
      bottom: { subCategoryTokens: ['西裤', '直筒裤', '烟管裤'], styleTags: ['通勤'] },
      shoes: { subCategoryTokens: ['乐福', '皮鞋'] }
    },
    occasionTags: ['work'],
    seasonTags: ['spring', 'autumn', 'winter'],
    strategyTags: ['outfitFormula', 'occasionNiche', 'capsuleWardrobe']
  },
  {
    id: 'shirt-denim-blazer',
    name: '衬衫/T恤 + 牛仔裤 + 西装外套',
    requiredSlots: ['top', 'bottom'],
    constraints: {
      top: { subCategoryTokens: ['衬衫', 'T恤', 't恤'], styleTags: ['基础', '极简'] },
      bottom: { subCategoryTokens: ['牛仔', '直筒'], styleTags: ['休闲'] },
      outerLayer: { subCategoryTokens: ['西装', '夹克'] }
    },
    occasionTags: ['work', 'casual'],
    seasonTags: ['spring', 'autumn'],
    strategyTags: ['outfitFormula', 'wrongShoeTheory', 'proportionBalance']
  },
  {
    id: 'dress-outer-boots',
    name: '连衣裙 + 外层 + 靴子',
    requiredSlots: ['dress'],
    constraints: {
      dress: { subCategoryTokens: ['连衣裙', '裙'], styleTags: ['通勤', '优雅', '甜美'] },
      outerLayer: { subCategoryTokens: ['外套', '西装', '风衣', '开衫'] },
      shoes: { subCategoryTokens: ['靴'] }
    },
    occasionTags: ['work', 'date'],
    seasonTags: ['spring', 'autumn', 'winter'],
    strategyTags: ['outfitFormula', 'layering', 'occasionNiche']
  },
  {
    id: 'tee-wide-pants-sneaker',
    name: 'T恤 + 宽松裤 + 运动鞋',
    requiredSlots: ['top', 'bottom'],
    constraints: {
      top: { subCategoryTokens: ['T恤', 't恤', '卫衣'], styleTags: ['休闲', '基础'] },
      bottom: { subCategoryTokens: ['阔腿', '休闲裤', '牛仔'], styleTags: ['休闲'] },
      shoes: { subCategoryTokens: ['运动', '帆布'] }
    },
    occasionTags: ['casual', 'travel', 'outdoor'],
    seasonTags: ['spring', 'summer', 'autumn'],
    strategyTags: ['outfitFormula', 'capsuleWardrobe', 'proportionBalance']
  },
  {
    id: 'tonal-column',
    name: '同色内搭柱 + 外层',
    requiredSlots: ['top', 'bottom'],
    constraints: {
      top: { styleTags: ['极简', '基础', '通勤'] },
      bottom: { styleTags: ['极简', '基础', '通勤'] },
      outerLayer: { subCategoryTokens: ['外套', '西装', '风衣', '开衫'] }
    },
    occasionTags: ['work', 'casual'],
    seasonTags: ['spring', 'autumn', 'winter'],
    strategyTags: ['outfitFormula', 'tonalDressing', 'sandwichDressing']
  }
]

function textForItem(item: ClosetItemCardData) {
  const meta = item.algorithmMeta

  return [
    item.category,
    item.subCategory,
    item.colorCategory,
    ...item.styleTags,
    ...(item.seasonTags ?? []),
    meta?.slot,
    meta?.layerRole,
    meta?.length,
    meta?.fabricWeight,
    meta?.pattern,
    ...(meta?.silhouette ?? []),
    ...(meta?.material ?? [])
  ].filter(Boolean).join(' ')
}

function hasAnyToken(text: string, tokens: string[] | undefined) {
  if (!tokens || tokens.length === 0) {
    return true
  }

  const normalizedText = normalizeInput(text)
  return tokens.some((token) => normalizedText.includes(normalizeInput(token)))
}

function slotMatchesCategory(slot: OutfitFormulaSlot, item: ClosetItemCardData) {
  if (slot === 'top') {
    return isTopCategory(item.category)
  }

  if (slot === 'bottom') {
    return isBottomCategory(item.category)
  }

  if (slot === 'dress') {
    return isOnePieceCategory(item.category)
  }

  return true
}

export function itemMatchesFormulaSlot(item: ClosetItemCardData, formula: OutfitFormula, slot: OutfitFormulaSlot) {
  const constraint = formula.constraints[slot]

  if (!slotMatchesCategory(slot, item)) {
    return false
  }

  if (!constraint) {
    return true
  }

  const text = textForItem(item)
  const categoryMatch = !constraint.categories || constraint.categories.some((category) => normalizeInput(item.category) === normalizeInput(category))
  const subCategoryMatch = hasAnyToken(text, constraint.subCategoryTokens)
  const styleMatch = hasAnyToken(text, constraint.styleTags)
  const colorMatch = hasAnyToken(text, constraint.colors)
  const silhouetteMatch = hasAnyToken(text, constraint.silhouetteTokens)
  const materialMatch = hasAnyToken(text, constraint.materialTokens)

  return categoryMatch && subCategoryMatch && styleMatch && colorMatch && silhouetteMatch && materialMatch
}

function sceneFit(formula: OutfitFormula, profile: PreferenceProfile) {
  if (formula.occasionTags.length === 0 || profile.preferredScenes.length === 0) {
    return 0.6
  }

  return formula.occasionTags.some((scene) => profile.preferredScenes.includes(scene)) ? 1 : 0.45
}

function weatherFit(formula: OutfitFormula, weather: TodayWeather | null) {
  if (!weather) {
    return 0.75
  }

  if (weather.isWarm && formula.seasonTags.includes('winter')) {
    return 0.35
  }

  if (weather.isCold && formula.seasonTags.includes('summer') && !formula.seasonTags.includes('winter')) {
    return 0.35
  }

  return 1
}

export function rankOutfitFormulas({
  profile,
  weather
}: {
  profile: PreferenceProfile
  weather: TodayWeather | null
}) {
  return [...OUTFIT_FORMULAS].sort((left, right) => {
    const leftScore = sceneFit(left, profile) * 0.65 + weatherFit(left, weather) * 0.35
    const rightScore = sceneFit(right, profile) * 0.65 + weatherFit(right, weather) * 0.35

    if (rightScore !== leftScore) {
      return rightScore - leftScore
    }

    return left.id.localeCompare(right.id)
  })
}
