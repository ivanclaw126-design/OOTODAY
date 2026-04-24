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
  normalizeColorValue,
  normalizeInput,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'
import type {
  InspirationBreakdown,
  InspirationClosetMatch,
  InspirationKeyItem,
  InspirationLayerRole,
  InspirationMatchScoreBreakdown,
  InspirationOutfitSlot
} from '@/lib/inspiration/types'

const SCORE_WEIGHTS = {
  categoryScore: 0.35,
  slotScore: 0.15,
  colorScore: 0.2,
  silhouetteScore: 0.15,
  styleScore: 0.1,
  layerRoleScore: 0.05
} as const

function countSharedTags(a: string[], b: string[]) {
  const normalizedB = b.map((tag) => normalizeInput(tag))
  return a.map((tag) => normalizeInput(tag)).filter((tag) => normalizedB.includes(tag)).length
}

function itemSearchText(item: ClosetItemCardData) {
  return [item.category, item.subCategory, item.colorCategory, ...item.styleTags].filter(Boolean).join(' ').toLowerCase()
}

function inferSlotFromCategory(category: string | null | undefined): InspirationOutfitSlot | 'unknown' {
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

function normalizeSlot(value: string | null | undefined, fallbackCategory: string | null | undefined): InspirationOutfitSlot | 'unknown' {
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

function inferLayerRole(item: ClosetItemCardData): InspirationLayerRole {
  const slot = inferSlotFromCategory(item.category)

  if (slot === 'outerLayer') {
    return 'outer'
  }

  if (slot === 'onePiece') {
    return 'base'
  }

  if (slot === 'shoes' || slot === 'bag') {
    return 'support'
  }

  if (slot === 'accessory') {
    return 'statement'
  }

  if (slot === 'top') {
    return 'mid'
  }

  return 'base'
}

function splitFormulaTokens(value: string | string[] | null | undefined) {
  const normalizedValue = Array.isArray(value)
    ? value.map((entry) => normalizeInput(entry)).join(' ')
    : normalizeInput(value)

  if (!normalizedValue) {
    return []
  }

  const knownTokens = ['短', '长', '宽松', '修身', '直筒', '高腰', '低腰', '廓形', '垂坠', '硬挺', '收腰', '上短下长', '内短外长', '外松内紧', '长线条', '长外套', '短外套']
  const exactTokens = knownTokens.filter((token) => normalizedValue.includes(token))
  const splitTokens = normalizedValue
    .split(/[\s,，/、+＋·。；;:：-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)

  return [...new Set([...exactTokens, ...splitTokens])].slice(0, 6)
}

function scoreFormulaColorMatch(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeColorValue(left)
  const normalizedRight = normalizeColorValue(right)
  const compatibilityScore = scoreColorCompatibility(normalizedLeft, normalizedRight)

  if (compatibilityScore <= 0) {
    return 0
  }

  if (normalizedLeft === normalizedRight) {
    return 1
  }

  return compatibilityScore / 3
}

function scoreClosetItem(inspirationItem: InspirationKeyItem, closetItem: ClosetItemCardData) {
  const normalizedInspirationCategory = normalizeCategoryValue(inspirationItem.category)
  const normalizedClosetCategory = normalizeCategoryValue(closetItem.category)
  const inspirationSlot = normalizeSlot(inspirationItem.slot, inspirationItem.category)
  const closetSlot = inferSlotFromCategory(closetItem.category)
  const closetText = itemSearchText(closetItem)
  const layerRole = inspirationItem.layerRole
  const closetLayerRole = inferLayerRole(closetItem)
  const rawColorScore = scoreFormulaColorMatch(inspirationItem.colorHint, closetItem.colorCategory)
  const sharedTagCount = countSharedTags(closetItem.styleTags, inspirationItem.styleTags)
  const styleDenominator = Math.max(1, Math.min(3, inspirationItem.styleTags.length))
  const silhouetteTokens = splitFormulaTokens(inspirationItem.silhouette)
  const silhouetteMatchCount = silhouetteTokens.filter((token) => closetText.includes(token)).length
  const categoryScore = normalizedClosetCategory === normalizedInspirationCategory ? SCORE_WEIGHTS.categoryScore : 0
  const slotScore = closetSlot === inspirationSlot ? SCORE_WEIGHTS.slotScore : 0
  const colorScore = rawColorScore * SCORE_WEIGHTS.colorScore
  const silhouetteScore = silhouetteTokens.length > 0
    ? (silhouetteMatchCount / silhouetteTokens.length) * SCORE_WEIGHTS.silhouetteScore
    : 0
  const styleScore = (Math.min(sharedTagCount, styleDenominator) / styleDenominator) * SCORE_WEIGHTS.styleScore
  const layerRoleScore = layerRole && layerRole === closetLayerRole ? SCORE_WEIGHTS.layerRoleScore : 0
  const total = categoryScore + slotScore + colorScore + silhouetteScore + styleScore + layerRoleScore
  const matchType = normalizedClosetCategory === normalizedInspirationCategory ? 'sameCategory' : 'formulaSubstitute'
  const scoreBreakdown: InspirationMatchScoreBreakdown = {
    total,
    categoryScore,
    slotScore,
    colorScore,
    silhouetteScore,
    styleScore,
    layerRoleScore,
    matchType
  }

  return {
    item: closetItem,
    score: total,
    scoreBreakdown,
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
    return '同类替代：按类别 35%、slot 15%、颜色 20%、轮廓 15%、风格 10%、层次 5% 加权排序。'
  }

  return '公式替代：衣橱里没有同类单品，先按 slot、颜色、轮廓、风格或层次角色找替代。'
}

function buildSubstituteSuggestion(inspirationItem: InspirationKeyItem, matchedItems: ClosetItemCardData[], hasExactCategory: boolean) {
  if (hasExactCategory) {
    return null
  }

  const alternatives = inspirationItem.alternatives ?? []
  const alternativeText = alternatives.length > 0 ? ` 可替代方向：${alternatives.join(' / ')}。` : ''

  if (matchedItems.length > 0) {
    return `没有同类单品时，先用这些相近单品保住${inspirationItem.slot ? ` ${inspirationItem.slot} slot` : '相同穿搭位置'}、颜色/轮廓和整体公式。${alternativeText}`.trim()
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
    const bestScoreBreakdown = scoredItems[0]?.scoreBreakdown ?? {
      total: 0,
      categoryScore: 0,
      slotScore: 0,
      colorScore: 0,
      silhouetteScore: 0,
      styleScore: 0,
      layerRoleScore: 0,
      matchType: 'missing' as const
    }
    const matchedEntries = scoredItems
      .filter((entry) => entry.score >= (hasExactCategory ? 0.32 : 0.22))
      .slice(0, 2)
    const matchedItems = matchedEntries
      .map((entry) => entry.item)

    return {
      inspirationItem,
      matchedItems,
      matchReason: buildMatchReason({ hasExactCategory, matchedItems, inspirationItem }),
      substituteSuggestion: buildSubstituteSuggestion(inspirationItem, matchedItems, hasExactCategory),
      scoreBreakdown: matchedEntries[0]?.scoreBreakdown ?? bestScoreBreakdown
    }
  })
}
