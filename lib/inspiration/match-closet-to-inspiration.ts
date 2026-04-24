import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  BOTTOM_CATEGORY,
  ONE_PIECE_CATEGORY,
  OUTER_LAYER_CATEGORY,
  SHOES_CATEGORY,
  BAG_CATEGORY,
  ACCESSORY_CATEGORY,
  TOP_CATEGORY,
  normalizeCategoryValue,
  normalizeInput,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'
import type { InspirationBreakdown, InspirationClosetMatch, InspirationKeyItem } from '@/lib/inspiration/types'

function countSharedTags(a: string[], b: string[]) {
  const normalizedB = b.map((tag) => normalizeInput(tag))
  return a.map((tag) => normalizeInput(tag)).filter((tag) => normalizedB.includes(tag)).length
}

function itemSearchText(item: ClosetItemCardData) {
  return [item.category, item.subCategory, item.colorCategory, ...item.styleTags].filter(Boolean).join(' ').toLowerCase()
}

function inferSlotFromCategory(category: string | null | undefined) {
  const normalizedCategory = normalizeCategoryValue(category)

  if (normalizedCategory === TOP_CATEGORY) {
    return 'top'
  }

  if (normalizedCategory === BOTTOM_CATEGORY) {
    return 'bottom'
  }

  if (normalizedCategory === ONE_PIECE_CATEGORY) {
    return 'onePiece'
  }

  if (normalizedCategory === OUTER_LAYER_CATEGORY) {
    return 'outerLayer'
  }

  if (normalizedCategory === SHOES_CATEGORY) {
    return 'shoes'
  }

  if (normalizedCategory === BAG_CATEGORY) {
    return 'bag'
  }

  if (normalizedCategory === ACCESSORY_CATEGORY) {
    return 'accessory'
  }

  return 'unknown'
}

function normalizeSlot(value: string | null | undefined, fallbackCategory: string | null | undefined) {
  const normalizedValue = normalizeInput(value)

  if (['top', 'tops', '上装', '上衣'].includes(normalizedValue)) {
    return 'top'
  }

  if (['bottom', 'bottoms', '下装', '裤装', '裙装'].includes(normalizedValue)) {
    return 'bottom'
  }

  if (['onepiece', 'one_piece', 'dress', '连体', '连体/全身装', '全身装'].includes(normalizedValue)) {
    return 'onePiece'
  }

  if (['outerlayer', 'outer_layer', 'outerwear', '外层', '外套'].includes(normalizedValue)) {
    return 'outerLayer'
  }

  if (['shoes', 'shoe', 'footwear', '鞋履', '鞋子'].includes(normalizedValue)) {
    return 'shoes'
  }

  if (['bag', 'bags', '包袋', '包'].includes(normalizedValue)) {
    return 'bag'
  }

  if (['accessory', 'accessories', '配饰'].includes(normalizedValue)) {
    return 'accessory'
  }

  return inferSlotFromCategory(fallbackCategory)
}

function inferLayerRole(item: ClosetItemCardData) {
  const slot = inferSlotFromCategory(item.category)

  if (slot === 'outerLayer') {
    return 'outer'
  }

  if (slot === 'onePiece') {
    return 'standalone'
  }

  if (slot === 'shoes' || slot === 'bag') {
    return 'finisher'
  }

  if (slot === 'accessory') {
    return 'accent'
  }

  if (slot === 'top') {
    return 'inner'
  }

  return 'base'
}

function splitFormulaTokens(value: string | null | undefined) {
  const normalizedValue = normalizeInput(value)

  if (!normalizedValue) {
    return []
  }

  const knownTokens = ['短', '长', '宽松', '修身', '直筒', '高腰', '低腰', '廓形', '垂坠', '硬挺', '收腰', '上短下长', '内短外长', '外松内紧']
  const exactTokens = knownTokens.filter((token) => normalizedValue.includes(token))
  const splitTokens = normalizedValue
    .split(/[\s,，/、+＋·。；;:：-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)

  return [...new Set([...exactTokens, ...splitTokens])].slice(0, 6)
}

function scoreClosetItem(inspirationItem: InspirationKeyItem, closetItem: ClosetItemCardData) {
  const normalizedInspirationCategory = normalizeCategoryValue(inspirationItem.category)
  const normalizedClosetCategory = normalizeCategoryValue(closetItem.category)
  const inspirationSlot = normalizeSlot(inspirationItem.slot, inspirationItem.category)
  const closetSlot = inferSlotFromCategory(closetItem.category)
  const closetText = itemSearchText(closetItem)
  const layerRole = normalizeInput(inspirationItem.layerRole)
  const closetLayerRole = inferLayerRole(closetItem)
  const colorScore = inspirationItem.colorHint ? scoreColorCompatibility(inspirationItem.colorHint, closetItem.colorCategory) : 0
  const sharedTagCount = countSharedTags(closetItem.styleTags, inspirationItem.styleTags)
  const silhouetteTokens = splitFormulaTokens(inspirationItem.silhouette)
  const silhouetteScore = silhouetteTokens.some((token) => closetText.includes(token)) ? 14 : 0
  const categoryScore = normalizedClosetCategory === normalizedInspirationCategory ? 36 : 0
  const slotScore = closetSlot === inspirationSlot ? 22 : 0
  const layerScore = layerRole && layerRole === closetLayerRole ? 10 : 0
  const colorWeight = inspirationItem.importance === 'high' ? 5 : 4

  return {
    item: closetItem,
    score:
      categoryScore +
      slotScore +
      colorScore * colorWeight +
      Math.min(sharedTagCount, 3) * 8 +
      silhouetteScore +
      layerScore,
    exactCategory: normalizedClosetCategory === normalizedInspirationCategory,
    sameSlot: closetSlot === inspirationSlot
  }
}

function buildMatchReason({
  hasExactCategory,
  matchedItems,
  inspirationItem
}: {
  hasExactCategory: boolean
  matchedItems: ClosetItemCardData[]
  inspirationItem: InspirationKeyItem
}) {
  if (matchedItems.length === 0) {
    return `暂时没有能稳定承接“${inspirationItem.label}”公式角色的单品。`
  }

  if (hasExactCategory) {
    return '按类别/slot、颜色、轮廓、风格标签和层次角色综合排序。'
  }

  return '衣橱里没有同类单品，先按相近 slot、颜色、风格或层次角色找替代。'
}

function buildSubstituteSuggestion(inspirationItem: InspirationKeyItem, matchedItems: ClosetItemCardData[], hasExactCategory: boolean) {
  if (hasExactCategory) {
    return null
  }

  const alternatives = inspirationItem.alternatives ?? []
  const alternativeText = alternatives.length > 0 ? ` 可替代方向：${alternatives.join(' / ')}。` : ''

  if (matchedItems.length > 0) {
    return `没有同类单品时，先用这些相近单品保住${inspirationItem.slot ? ` ${inspirationItem.slot} slot` : '相同穿搭位置'}和整体公式。${alternativeText}`.trim()
  }

  return `没有同类单品，也没有足够接近的替代；先记住它承担的是“${inspirationItem.layerRole ?? inspirationItem.slot ?? inspirationItem.category}”角色。${alternativeText}`.trim()
}

export function matchClosetToInspiration(
  breakdown: InspirationBreakdown,
  closetItems: ClosetItemCardData[]
): InspirationClosetMatch[] {
  return breakdown.keyItems.map((inspirationItem) => {
    const normalizedCategory = normalizeCategoryValue(inspirationItem.category)
    const scoredItems = closetItems
      .map((item) => scoreClosetItem(inspirationItem, item))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        if (Number(right.exactCategory) !== Number(left.exactCategory)) {
          return Number(right.exactCategory) - Number(left.exactCategory)
        }

        if (Number(right.sameSlot) !== Number(left.sameSlot)) {
          return Number(right.sameSlot) - Number(left.sameSlot)
        }

        return left.item.wearCount - right.item.wearCount
      })
    const hasExactCategory = closetItems.some((item) => normalizeCategoryValue(item.category) === normalizedCategory)
    const matchedItems = scoredItems
      .filter((entry) => entry.score >= (hasExactCategory ? 24 : 16))
      .slice(0, 2)
      .map((entry) => entry.item)

    return {
      inspirationItem,
      matchedItems,
      matchReason: buildMatchReason({ hasExactCategory, matchedItems, inspirationItem }),
      substituteSuggestion: buildSubstituteSuggestion(inspirationItem, matchedItems, hasExactCategory)
    }
  })
}
