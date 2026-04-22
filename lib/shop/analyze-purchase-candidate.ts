import type { ClosetItemCardData } from '@/lib/closet/types'
import type { ShopCandidateItem, ShopPurchaseAnalysis } from '@/lib/shop/types'

const supportedFashionCategories = ['上衣', '裤装', '裙装', '连衣裙', '外套'] as const

function normalizeCategory(category: string) {
  if (category === '裤子') {
    return '裤装'
  }

  return category
}

export function getUnsupportedShopCategoryMessage(category: string) {
  const normalizedCategory = normalizeCategory(category)

  if (supportedFashionCategories.includes(normalizedCategory as (typeof supportedFashionCategories)[number])) {
    return null
  }

  return '当前只支持上衣、裤装、裙装、连衣裙、外套这类服饰单品分析，请换一个服饰商品链接或图片试试'
}

function isTop(category: string) {
  return normalizeCategory(category) === '上衣'
}

function isBottom(category: string) {
  const normalized = normalizeCategory(category)
  return normalized === '裤装' || normalized === '裙装'
}

function isDress(category: string) {
  return normalizeCategory(category) === '连衣裙'
}

function isOuter(category: string) {
  return normalizeCategory(category) === '外套'
}

function countSharedStyleTags(a: string[], b: string[]) {
  return a.filter((tag) => b.includes(tag)).length
}

function findDuplicateItems(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[]) {
  return closetItems.filter((item) => {
    const normalizedCategory = normalizeCategory(item.category)
    const candidateCategory = normalizeCategory(candidate.category)
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

  return 0
}

function getMissingCategoryHints(candidate: ShopCandidateItem, closetItems: ClosetItemCardData[]) {
  const tops = closetItems.filter((item) => isTop(item.category))
  const bottoms = closetItems.filter((item) => isBottom(item.category))
  const dresses = closetItems.filter((item) => isDress(item.category))
  const outerLayers = closetItems.filter((item) => isOuter(item.category))
  const hints: string[] = []

  if (isTop(candidate.category) && bottoms.length === 0) {
    hints.push('缺少能和它搭配的下装')
  }

  if (isBottom(candidate.category) && tops.length === 0) {
    hints.push('缺少能和它搭配的上装')
  }

  if (isDress(candidate.category) && outerLayers.length === 0) {
    hints.push('如果你想扩大场景覆盖，后续可以补一件外套')
  }

  if (isOuter(candidate.category) && dresses.length === 0 && (tops.length === 0 || bottoms.length === 0)) {
    hints.push('现有衣橱里可供叠搭的完整基础组合还不够')
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
  duplicateRisk: 'low' | 'medium' | 'high',
  estimatedOutfitCount: number,
  missingCategoryHints: string[]
) {
  if (duplicateRisk === 'high') {
    return {
      recommendation: 'skip' as const,
      recommendationReason: '你衣橱里已经有很接近的选择了，这次更像重复购买。'
    }
  }

  if (estimatedOutfitCount >= 3 && duplicateRisk === 'low') {
    return {
      recommendation: 'buy' as const,
      recommendationReason: '它和现有衣橱能快速接上，新增后大概率能立刻穿起来。'
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
    recommendationReason: duplicateRisk === 'medium' ? '它能补充搭配，但和现有单品有一定重叠，适合再想一下。' : '它可以补充现有衣橱，但收益还没有高到闭眼入。'
  }
}

export function analyzePurchaseCandidate(
  candidate: ShopCandidateItem,
  closetItems: ClosetItemCardData[]
): ShopPurchaseAnalysis {
  const duplicateItems = findDuplicateItems(candidate, closetItems)
  const duplicateRisk = getDuplicateRisk(candidate, duplicateItems)
  const estimatedOutfitCount = getEstimatedOutfitCount(candidate, closetItems)
  const missingCategoryHints = getMissingCategoryHints(candidate, closetItems)
  const { recommendation, recommendationReason } = buildRecommendation(
    duplicateRisk,
    estimatedOutfitCount,
    missingCategoryHints
  )

  return {
    candidate,
    duplicateItems,
    duplicateRisk,
    estimatedOutfitCount,
    missingCategoryHints,
    recommendation,
    recommendationReason
  }
}
