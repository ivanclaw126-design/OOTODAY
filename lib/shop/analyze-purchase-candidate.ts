import { buildClosetAnchoredColorHints } from '@/lib/closet/color-strategy'
import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  ACCESSORY_CATEGORY,
  BAG_CATEGORY,
  BOTTOM_CATEGORY,
  isAccessoryCategory,
  isBagCategory,
  isBottomCategory,
  isOnePieceCategory,
  isOuterwearCategory,
  isRecommendableCategory,
  isShoesCategory,
  isTopCategory,
  ONE_PIECE_CATEGORY,
  OUTER_LAYER_CATEGORY,
  normalizeCategoryValue,
  scoreColorCompatibility,
  SHOES_CATEGORY,
  TOP_CATEGORY
} from '@/lib/closet/taxonomy'
import { buildMissingSlotCopy } from '@/lib/recommendation/copy'
import type { RecommendationPreferenceState } from '@/lib/recommendation/preference-types'
import type { ShopCandidateItem, ShopPurchaseAnalysis, ShopWardrobeGapType } from '@/lib/shop/types'

export const supportedFashionCategories = [
  TOP_CATEGORY,
  BOTTOM_CATEGORY,
  ONE_PIECE_CATEGORY,
  OUTER_LAYER_CATEGORY,
  SHOES_CATEGORY,
  BAG_CATEGORY,
  ACCESSORY_CATEGORY
] as const

type CoreOutfit = {
  id: string
  items: ClosetItemCardData[]
  styleTags: string[]
  colors: Array<string | null>
  hasShoes: boolean
  hasBag: boolean
}

export function getUnsupportedShopCategoryMessage(category: string) {
  if (isRecommendableCategory(category)) {
    return null
  }

  return '当前支持上装、下装、连体/全身装、外层、鞋履、包袋、配饰这类时尚单品分析，请换一个商品链接或图片试试'
}

function isTop(category: string) {
  return isTopCategory(category)
}

function isBottom(category: string) {
  return isBottomCategory(category)
}

function isDress(category: string) {
  return isOnePieceCategory(category)
}

function isOuter(category: string) {
  return isOuterwearCategory(category)
}

function isShoes(category: string) {
  return isShoesCategory(category)
}

function isBag(category: string) {
  return isBagCategory(category)
}

function isAccessory(category: string) {
  return isAccessoryCategory(category)
}

function countSharedStyleTags(a: string[], b: string[]) {
  return a.filter((tag) => b.includes(tag)).length
}

function textForCandidate(candidate: ShopCandidateItem) {
  return [candidate.category, candidate.subCategory, candidate.colorCategory, candidate.sourceTitle, ...candidate.styleTags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => {
    const normalized = value.trim().toLowerCase()
    return normalized.length > 0 && text.includes(normalized)
  })
}

function isComfortCandidate(candidate: ShopCandidateItem) {
  return includesAny(textForCandidate(candidate), ['舒适', '休闲', '运动', '平底', '宽松', '基础', '针织', 'sneaker', 'flat'])
}

function isLoudCandidate(candidate: ShopCandidateItem) {
  return includesAny(textForCandidate(candidate), ['红色', '黄色', '橙色', '亮色', '高饱和', '撞色', 'logo', '大logo', '印花', '图案', '多焦点'])
}

function isVisualFocusCandidate(candidate: ShopCandidateItem) {
  return isBag(candidate.category) || isAccessory(candidate.category) || includesAny(textForCandidate(candidate), ['亮点', '重点', '视觉中心', '配饰', '包'])
}

function hasGoodColorCall(candidate: ShopCandidateItem, outfit: CoreOutfit) {
  return outfit.colors.some((color) => scoreColorCompatibility(candidate.colorCategory, color) >= 2)
}

function hasSceneOrStyleCall(candidate: ShopCandidateItem, outfit: CoreOutfit) {
  return countSharedStyleTags(candidate.styleTags, outfit.styleTags) > 0
}

function buildCoreOutfits(closetItems: ClosetItemCardData[]): CoreOutfit[] {
  const tops = closetItems.filter((item) => isTop(item.category))
  const bottoms = closetItems.filter((item) => isBottom(item.category))
  const dresses = closetItems.filter((item) => isDress(item.category))
  const shoes = closetItems.filter((item) => isShoes(item.category))
  const bags = closetItems.filter((item) => isBag(item.category))
  const outfits: CoreOutfit[] = []

  for (const dress of dresses) {
    outfits.push({
      id: `dress-${dress.id}`,
      items: [dress],
      styleTags: dress.styleTags,
      colors: [dress.colorCategory],
      hasShoes: shoes.length > 0,
      hasBag: bags.length > 0
    })
  }

  for (const top of tops) {
    for (const bottom of bottoms) {
      outfits.push({
        id: `set-${top.id}-${bottom.id}`,
        items: [top, bottom],
        styleTags: [...top.styleTags, ...bottom.styleTags],
        colors: [top.colorCategory, bottom.colorCategory],
        hasShoes: shoes.length > 0,
        hasBag: bags.length > 0
      })
    }
  }

  return outfits
}

function findDuplicateItems(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[]) {
  return closetItems.filter((item) => {
    const normalizedCategory = normalizeCategoryValue(item.category)
    const candidateCategory = normalizeCategoryValue(candidate.category)
    const sameCategory = normalizedCategory === candidateCategory
    const sameSubCategory = item.subCategory && item.subCategory === candidate.subCategory
    const sameColor = item.colorCategory && item.colorCategory === candidate.colorCategory
    const sharedTags = countSharedStyleTags(item.styleTags, candidate.styleTags)

    if (!sameCategory) {
      return false
    }

    return Boolean(sameSubCategory || (sameColor && sharedTags > 0) || sharedTags >= 2)
  })
}

function getEstimatedOutfitCount(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[]) {
  const tops = closetItems.filter((item) => isTop(item.category))
  const bottoms = closetItems.filter((item) => isBottom(item.category))
  const dresses = closetItems.filter((item) => isDress(item.category))
  const outerLayers = closetItems.filter((item) => isOuter(item.category))
  const coreOutfits = buildCoreOutfits(closetItems)

  if (isTop(candidate.category)) {
    return bottoms.length
  }

  if (isBottom(candidate.category)) {
    return tops.length
  }

  if (isDress(candidate.category)) {
    return Math.max(1, 1 + outerLayers.length)
  }

  if (isOuter(candidate.category)) {
    return dresses.length + Math.min(tops.length, bottoms.length)
  }

  if (isShoes(candidate.category)) {
    return coreOutfits.filter((outfit) => hasGoodColorCall(candidate, outfit) || hasSceneOrStyleCall(candidate, outfit)).length
  }

  if (isBag(candidate.category)) {
    return coreOutfits.filter((outfit) => hasGoodColorCall(candidate, outfit) && hasSceneOrStyleCall(candidate, outfit)).length
  }

  if (isAccessory(candidate.category)) {
    const styleMatches = coreOutfits.filter((outfit) => hasSceneOrStyleCall(candidate, outfit)).length
    const colorMatches = coreOutfits.filter((outfit) => hasGoodColorCall(candidate, outfit)).length
    return Math.max(styleMatches, colorMatches >= 2 ? 1 : 0)
  }

  return 0
}

function getCompletesIncompleteOutfitCount(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[]) {
  const coreOutfits = buildCoreOutfits(closetItems)

  if (isShoes(candidate.category)) {
    return coreOutfits.filter((outfit) => !outfit.hasShoes && (hasGoodColorCall(candidate, outfit) || hasSceneOrStyleCall(candidate, outfit))).length
  }

  if (isBag(candidate.category)) {
    return coreOutfits.filter((outfit) => !outfit.hasBag && hasGoodColorCall(candidate, outfit)).length
  }

  return 0
}

function getGapType(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[], estimatedOutfitCount: number): ShopWardrobeGapType {
  const tops = closetItems.filter((item) => isTop(item.category))
  const bottoms = closetItems.filter((item) => isBottom(item.category))
  const dresses = closetItems.filter((item) => isDress(item.category))
  const shoes = closetItems.filter((item) => isShoes(item.category))
  const bags = closetItems.filter((item) => isBag(item.category))
  const accessories = closetItems.filter((item) => isAccessory(item.category))

  if ((isTop(candidate.category) && bottoms.length > 0) || (isBottom(candidate.category) && tops.length > 0) || (isOuter(candidate.category) && (dresses.length > 0 || (tops.length > 0 && bottoms.length > 0)))) {
    return estimatedOutfitCount > 0 ? 'coreOutfit' : null
  }

  if (isDress(candidate.category)) {
    return 'coreOutfit'
  }

  if (isShoes(candidate.category)) {
    return shoes.length === 0 || getCompletesIncompleteOutfitCount(candidate, closetItems) > 0 ? 'shoeFinisher' : null
  }

  if (isBag(candidate.category)) {
    return bags.length === 0 || getCompletesIncompleteOutfitCount(candidate, closetItems) > 0 ? 'sceneBag' : null
  }

  if (isAccessory(candidate.category)) {
    return accessories.length === 0 ? 'visualFocus' : 'styleReinforcement'
  }

  return null
}

function getMissingCategoryHints(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[]) {
  const tops = closetItems.filter((item) => isTop(item.category))
  const bottoms = closetItems.filter((item) => isBottom(item.category))
  const dresses = closetItems.filter((item) => isDress(item.category))
  const outerLayers = closetItems.filter((item) => isOuter(item.category))
  const shoes = closetItems.filter((item) => isShoes(item.category))
  const bags = closetItems.filter((item) => isBag(item.category))
  const coreOutfits = buildCoreOutfits(closetItems)
  const hints: string[] = []

  if (isTop(candidate.category) && bottoms.length === 0) {
    hints.push('缺少能和它搭配的下装')
  }

  if (isBottom(candidate.category) && tops.length === 0) {
    hints.push('缺少能和它搭配的上装')
  }

  if (isDress(candidate.category) && outerLayers.length === 0) {
    hints.push('如果你想扩大场景覆盖，后续可以补一件外层')
  }

  if (isOuter(candidate.category) && dresses.length === 0 && (tops.length === 0 || bottoms.length === 0)) {
    hints.push('现有衣橱里可供叠搭的完整基础组合还不够')
  }

  if (isShoes(candidate.category) && coreOutfits.length === 0) {
    hints.push('鞋履需要先有上装+下装或连体/全身装，才能真正收尾成套')
  }

  if (isShoes(candidate.category) && coreOutfits.length > 0 && shoes.length === 0) {
    hints.push(buildMissingSlotCopy('shoes', 'shop'))
  }

  if (isBag(candidate.category) && coreOutfits.length > 0 && bags.length === 0) {
    hints.push(buildMissingSlotCopy('bag', 'shop'))
  }

  if ((isBag(candidate.category) || isAccessory(candidate.category)) && coreOutfits.length === 0) {
    hints.push('先补出至少一套核心衣服组合，再看包袋和配饰收益会更准')
  }

  if (isAccessory(candidate.category) && coreOutfits.length > 0) {
    hints.push(buildMissingSlotCopy('accessories', 'shop'))
  }

  return hints
}

function getDuplicateRisk(candidate: ShopCandidateItem, duplicateItems: ClosetItemCardData[]) {
  const exactCount = duplicateItems.filter((item) => item.subCategory === candidate.subCategory).length

  if (exactCount >= 2 || duplicateItems.length >= 3) {
    return 'high' as const
  }

  if (exactCount >= 1 || duplicateItems.length >= 1) {
    return 'medium' as const
  }

  return 'low' as const
}

function buildRecommendation(
  candidate: ShopCandidateItem,
  duplicateRisk: 'low' | 'medium' | 'high',
  estimatedOutfitCount: number,
  missingCategoryHints: string[],
  colorStrategyHints: string[],
  fillsWardrobeGap: boolean,
  gapType: ShopWardrobeGapType,
  completesIncompleteOutfitCount: number
) {
  if (duplicateRisk === 'high') {
    return {
      recommendation: 'skip' as const,
      recommendationReason: '你衣橱里已经有很接近的选择了，这次更像重复购买。'
    }
  }

  if (isAccessory(candidate.category)) {
    if (estimatedOutfitCount === 0) {
      return {
        recommendation: 'consider' as const,
        recommendationReason: missingCategoryHints[0] ?? '它更像造型强化，不是直接新增套数；如果你正缺视觉中心，可以考虑。'
      }
    }

    return {
      recommendation: duplicateRisk === 'low' && fillsWardrobeGap ? 'buy' as const : 'consider' as const,
      recommendationReason:
        gapType === 'visualFocus'
          ? `它主要补视觉中心和风格记忆点，不是简单增加可搭套数；当前大约能强化 ${estimatedOutfitCount} 套已有思路。`
          : `它能强化已有风格线索，大约能服务 ${estimatedOutfitCount} 套搭配，但收益更偏造型细节。`
    }
  }

  if (isShoes(candidate.category)) {
    if (estimatedOutfitCount >= 3 && duplicateRisk === 'low') {
      return {
        recommendation: 'buy' as const,
        recommendationReason: `它能给 ${estimatedOutfitCount} 套已有核心搭配收尾，其中 ${completesIncompleteOutfitCount} 套属于当前缺鞋的组合。`
      }
    }

    if (estimatedOutfitCount === 0) {
      return {
        recommendation: 'skip' as const,
        recommendationReason: missingCategoryHints[0] ?? '这双鞋暂时接不上现有核心搭配，买了也容易闲置。'
      }
    }

    return {
      recommendation: 'consider' as const,
      recommendationReason: `它能给 ${estimatedOutfitCount} 套已有核心搭配收尾，但收益还没有高到闭眼入。`
    }
  }

  if (isBag(candidate.category)) {
    if (estimatedOutfitCount >= 2 && duplicateRisk === 'low') {
      return {
        recommendation: 'buy' as const,
        recommendationReason: `它能补足 ${estimatedOutfitCount} 套搭配的场景完整度，颜色也能和衣橱形成呼应。`
      }
    }

    if (estimatedOutfitCount === 0) {
      return {
        recommendation: 'consider' as const,
        recommendationReason: missingCategoryHints[0] ?? '它更偏场景补充，但当前颜色或风格呼应还不够明确。'
      }
    }
  }

  if (estimatedOutfitCount >= 3 && duplicateRisk === 'low') {
    return {
      recommendation: 'buy' as const,
      recommendationReason: colorStrategyHints[0]
        ? `它和现有衣橱能快速接上，新增后大概率能立刻穿起来。${colorStrategyHints[0]}。`
        : '它和现有衣橱能快速接上，新增后大概率能立刻穿起来。'
    }
  }

  if (estimatedOutfitCount === 0) {
    return {
      recommendation: 'skip' as const,
      recommendationReason: missingCategoryHints[0] ?? '你现有衣橱暂时接不住它，买了也容易闲置。'
    }
  }

  return {
    recommendation: 'consider' as const,
    recommendationReason:
      duplicateRisk === 'medium'
        ? colorStrategyHints[0]
          ? `它能补充搭配，但和现有单品有一定重叠，适合再想一下。${colorStrategyHints[0]}。`
          : '它能补充搭配，但和现有单品有一定重叠，适合再想一下。'
        : colorStrategyHints[0]
          ? `它可以补充现有衣橱，但收益还没有高到闭眼入。${colorStrategyHints[0]}。`
          : '它可以补充现有衣橱，但收益还没有高到闭眼入。'
  }
}

function applyPreferenceToRecommendation({
  candidate,
  recommendation,
  recommendationReason,
  preferenceState
}: {
  candidate: ShopCandidateItem
  recommendation: 'buy' | 'consider' | 'skip'
  recommendationReason: string
  preferenceState?: RecommendationPreferenceState | null
}) {
  const profile = preferenceState?.profile

  if (!profile) {
    return { recommendation, recommendationReason, preferenceNotes: [] }
  }

  const notes: string[] = []
  let nextRecommendation = recommendation
  const candidateText = textForCandidate(candidate)

  if (includesAny(candidateText, profile.hardAvoids)) {
    notes.push('命中了你的 hard avoids，不建议购买。')
    return {
      recommendation: 'skip' as const,
      recommendationReason: `${recommendationReason} 命中了你的 hard avoids，不建议购买。`,
      preferenceNotes: notes
    }
  }

  const comfortLeads = profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority
  const styleLeads = profile.practicalityPreference.stylePriority > profile.practicalityPreference.comfortPriority
  const lowKey =
    profile.colorPreference.saturation === 'low' ||
    profile.colorPreference.contrast === 'low' ||
    profile.colorPreference.palette === 'neutral' ||
    profile.colorPreference.accentTolerance === 0 ||
    profile.focalPointPreference === 'subtle'

  if (comfortLeads && (isShoes(candidate.category) || isComfortCandidate(candidate))) {
    notes.push('你的偏好更重视舒适度，这件单品的舒适/基础属性会提高购买价值。')

    if (nextRecommendation === 'consider') {
      nextRecommendation = 'buy'
    }
  }

  if (styleLeads && isVisualFocusCandidate(candidate)) {
    notes.push('你的偏好更重视造型完成度，包袋/配饰/视觉中心的价值会被提高。')

    if (nextRecommendation === 'consider') {
      nextRecommendation = 'buy'
    }
  }

  if (lowKey && isLoudCandidate(candidate)) {
    notes.push('你的日常偏好更低调，这件的大面积亮色、logo 或多焦点会降低购买优先级。')
    nextRecommendation = nextRecommendation === 'buy' ? 'consider' : 'skip'
  }

  if (notes.length === 0) {
    return { recommendation: nextRecommendation, recommendationReason, preferenceNotes: notes }
  }

  return {
    recommendation: nextRecommendation,
    recommendationReason: `${recommendationReason} ${notes[0]}`,
    preferenceNotes: notes
  }
}

export function analyzePurchaseCandidate(
  candidate: ShopCandidateItem,
  closetItems: ClosetItemCardData[],
  preferenceState?: RecommendationPreferenceState | null
): ShopPurchaseAnalysis {
  const duplicateItems = findDuplicateItems(candidate, closetItems)
  const duplicateRisk = getDuplicateRisk(candidate, duplicateItems)
  const estimatedOutfitCount = getEstimatedOutfitCount(candidate, closetItems)
  const unlocksOutfitCount = estimatedOutfitCount
  const completesIncompleteOutfitCount = getCompletesIncompleteOutfitCount(candidate, closetItems)
  const gapType = getGapType(candidate, closetItems, estimatedOutfitCount)
  const fillsWardrobeGap = Boolean(gapType) && (estimatedOutfitCount > 0 || completesIncompleteOutfitCount > 0)
  const missingCategoryHints = getMissingCategoryHints(candidate, closetItems)
  const colorStrategyHints = buildClosetAnchoredColorHints(candidate.colorCategory, closetItems).map((hint) => hint.replace(/。$/u, ''))
  const baseRecommendation = buildRecommendation(
    candidate,
    duplicateRisk,
    estimatedOutfitCount,
    missingCategoryHints,
    colorStrategyHints,
    fillsWardrobeGap,
    gapType,
    completesIncompleteOutfitCount
  )
  const { recommendation, recommendationReason, preferenceNotes } = applyPreferenceToRecommendation({
    candidate,
    ...baseRecommendation,
    preferenceState
  })

  return {
    candidate,
    duplicateItems,
    duplicateRisk,
    estimatedOutfitCount,
    unlocksOutfitCount,
    completesIncompleteOutfitCount,
    fillsWardrobeGap,
    gapType,
    missingCategoryHints,
    colorStrategyHints,
    preferenceNotes,
    recommendation,
    recommendationReason
  }
}
