import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  BOTTOM_CATEGORY,
  ONE_PIECE_CATEGORY,
  OUTER_LAYER_CATEGORY,
  SHOES_CATEGORY,
  BAG_CATEGORY,
  ACCESSORY_CATEGORY,
  TOP_CATEGORY,
  getColorIntensity,
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
import { DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { evaluateOutfit, getWeightedOutfitScore } from '@/lib/recommendation/outfit-evaluator'
import type { PreferenceProfile, RecommendationPreferenceState, ScoreWeights } from '@/lib/recommendation/preference-types'
import type { TodayRecommendationMissingSlot } from '@/lib/today/types'

const SCORE_WEIGHTS = {
  categoryScore: 0.35,
  slotScore: 0.15,
  colorScore: 0.2,
  silhouetteScore: 0.15,
  styleScore: 0.1,
  layerRoleScore: 0.05
} as const

type FormulaScoreWeights = Record<keyof typeof SCORE_WEIGHTS, number>

type PreferenceScoreContext = {
  profile: PreferenceProfile | null
  finalWeights: ScoreWeights | null
  weights: FormulaScoreWeights
}

type ScoredClosetItem = {
  item: ClosetItemCardData
  score: number
  scoreBreakdown: InspirationMatchScoreBreakdown
  exactCategory: boolean
  sameSlot: boolean
  blockedByHardAvoid: boolean
  tooFarForDaily: boolean
  preferenceNotes: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildPreferenceContext(preferenceState?: RecommendationPreferenceState | null): PreferenceScoreContext {
  const finalWeights = preferenceState?.finalWeights ?? null

  if (!finalWeights) {
    return {
      profile: preferenceState?.profile ?? null,
      finalWeights: null,
      weights: SCORE_WEIGHTS
    }
  }

  const nudgeWeight = (base: number, key: keyof ScoreWeights) => {
    const baseline = DEFAULT_RECOMMENDATION_WEIGHTS[key]
    const current = finalWeights[key]
    return base * clamp(1 + (current - baseline) * 0.35, 0.85, 1.15)
  }

  return {
    profile: preferenceState?.profile ?? null,
    finalWeights,
    weights: {
      categoryScore: SCORE_WEIGHTS.categoryScore,
      slotScore: nudgeWeight(SCORE_WEIGHTS.slotScore, 'completeness'),
      colorScore: nudgeWeight(SCORE_WEIGHTS.colorScore, 'colorHarmony'),
      silhouetteScore: nudgeWeight(SCORE_WEIGHTS.silhouetteScore, 'silhouetteBalance'),
      styleScore: nudgeWeight(SCORE_WEIGHTS.styleScore, 'focalPoint'),
      layerRoleScore: nudgeWeight(SCORE_WEIGHTS.layerRoleScore, 'layering')
    }
  }
}

function countSharedTags(a: string[], b: string[]) {
  const normalizedB = b.map((tag) => normalizeInput(tag))
  return a.map((tag) => normalizeInput(tag)).filter((tag) => normalizedB.includes(tag)).length
}

function itemSearchText(item: ClosetItemCardData) {
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
  ].filter(Boolean).join(' ').toLowerCase()
}

function keyItemSearchText(item: InspirationKeyItem) {
  return [
    item.label,
    item.category,
    item.colorHint,
    item.slot,
    item.layerRole,
    ...(item.silhouette ?? []),
    ...item.styleTags,
    ...(item.alternatives ?? [])
  ].filter(Boolean).join(' ').toLowerCase()
}

function includesAnyNeedle(text: string, needles: string[]) {
  const normalizedText = normalizeInput(text)

  return needles.some((needle) => {
    const normalizedNeedle = normalizeInput(needle)
    return normalizedNeedle.length > 0 && normalizedText.includes(normalizedNeedle)
  })
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

function inferSlotFromItem(item: ClosetItemCardData): InspirationOutfitSlot | 'unknown' {
  const slot = item.algorithmMeta?.slot

  if (slot === 'top') {
    return 'top'
  }

  if (slot === 'bottom') {
    return 'bottom'
  }

  if (slot === 'onePiece') {
    return 'onePiece'
  }

  if (slot === 'outerwear') {
    return 'outerLayer'
  }

  if (slot === 'shoes') {
    return 'shoes'
  }

  if (slot === 'bag') {
    return 'bag'
  }

  if (slot === 'accessory') {
    return 'accessory'
  }

  return inferSlotFromCategory(item.category)
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
  const metaLayerRole = item.algorithmMeta?.layerRole

  if (metaLayerRole === 'base' || metaLayerRole === 'mid' || metaLayerRole === 'outer' || metaLayerRole === 'statement' || metaLayerRole === 'support') {
    return metaLayerRole
  }

  const slot = inferSlotFromItem(item)

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

function getColorPreferenceFit(profile: PreferenceProfile | null, item: ClosetItemCardData, inspirationItem: InspirationKeyItem) {
  if (!profile) {
    return { multiplier: 1, fit: 0.7, note: null as string | null }
  }

  const intensity = getColorIntensity(item.colorCategory)
  const normalizedColor = normalizeColorValue(item.colorCategory)
  const colorText = normalizeInput(`${inspirationItem.colorHint ?? ''} ${item.colorCategory ?? ''} ${inspirationItem.label}`)
  const isBoldAccent = intensity === 'vivid'
  const isNeutral = ['黑色', '白色', '米白色', '浅灰色', '灰色', '深灰色', '米色', '卡其色', '驼色'].includes(normalizedColor)
  const prefersLowRisk =
    profile.colorPreference.saturation === 'low' ||
    profile.colorPreference.contrast === 'low' ||
    profile.colorPreference.accentTolerance === 0 ||
    profile.colorPreference.palette === 'neutral' ||
    profile.colorPreference.palette === 'tonal'

  if (prefersLowRisk && isNeutral) {
    return {
      multiplier: 1.12,
      fit: 0.9,
      note: '这件保留了你偏好的低饱和/基础色方向。'
    }
  }

  if (prefersLowRisk && (isBoldAccent || includesAnyNeedle(colorText, ['撞色', '高饱和', '亮色', '大胆']))) {
    return {
      multiplier: 0.55,
      fit: 0.25,
      note: '这件颜色比你日常偏好的低风险配色更跳，排序会被压低。'
    }
  }

  if (profile.colorPreference.accentTolerance >= 2 && isBoldAccent) {
    return {
      multiplier: 1.08,
      fit: 0.85,
      note: '你的颜色偏好能接受更明显的重点色。'
    }
  }

  return { multiplier: 1, fit: 0.65, note: null }
}

function getPreferredSilhouetteTokens(profile: PreferenceProfile | null) {
  if (!profile) {
    return []
  }

  return profile.silhouettePreference.flatMap((preference) => {
    if (preference === 'shortTopHighWaist') {
      return ['短', '短款', '高腰', '上短下长']
    }

    if (preference === 'looseTopSlimBottom') {
      return ['宽松', '外松内紧', '修身']
    }

    if (preference === 'fittedTopWideBottom') {
      return ['修身', '直筒', '宽松']
    }

    if (preference === 'relaxedAll') {
      return ['宽松', '垂坠', '松弛']
    }

    return ['连体', 'onepiece']
  })
}

function getSilhouettePreferenceFit(profile: PreferenceProfile | null, silhouetteTokens: string[], closetText: string) {
  if (!profile || profile.silhouettePreference.length === 0) {
    return { multiplier: 1, fit: 0.65, note: null as string | null }
  }

  const preferredTokens = getPreferredSilhouetteTokens(profile)
  const matchedPreferred = preferredTokens.some((token) => closetText.includes(normalizeInput(token)) || silhouetteTokens.includes(token))

  if (matchedPreferred) {
    return {
      multiplier: 1.1,
      fit: 0.85,
      note: '轮廓接近你的日常偏好。'
    }
  }

  return {
    multiplier: 0.9,
    fit: 0.45,
    note: '轮廓比你日常选择更有变化，适合作为轻度拓展。'
  }
}

function getLayerPreferenceFit(profile: PreferenceProfile | null, inspirationItem: InspirationKeyItem, closetLayerRole: InspirationLayerRole) {
  if (!profile) {
    return { multiplier: 1, fit: 0.65, note: null as string | null }
  }

  const isLayeredRole = inspirationItem.layerRole === 'outer' || inspirationItem.layerRole === 'mid' || closetLayerRole === 'outer'

  if (!isLayeredRole) {
    return { multiplier: 1, fit: 0.7, note: null }
  }

  if (profile.layeringPreference.complexity >= 2) {
    return {
      multiplier: 1.18,
      fit: 0.9,
      note: '你的叠穿复杂度偏好较高，可以接受这类多层替代。'
    }
  }

  if (profile.layeringPreference.complexity === 0) {
    return {
      multiplier: 0.72,
      fit: 0.35,
      note: '这套比你日常叠穿复杂一点，更适合作为灵感尝试。'
    }
  }

  return { multiplier: 0.94, fit: 0.55, note: '这套叠穿略高于你的日常复杂度。' }
}

function getFocalPreferenceFit(profile: PreferenceProfile | null, inspirationItem: InspirationKeyItem, closetSlot: InspirationOutfitSlot | 'unknown') {
  if (!profile) {
    return { multiplier: 1, fit: 0.65, note: null as string | null }
  }

  const focalSlotMatches =
    (profile.focalPointPreference === 'upperBody' && (closetSlot === 'top' || closetSlot === 'outerLayer')) ||
    (profile.focalPointPreference === 'waist' && closetSlot === 'bottom') ||
    (profile.focalPointPreference === 'shoes' && closetSlot === 'shoes') ||
    (profile.focalPointPreference === 'bagAccessory' && (closetSlot === 'bag' || closetSlot === 'accessory')) ||
    (profile.focalPointPreference === 'subtle' && inspirationItem.importance !== 5)

  if (focalSlotMatches) {
    return {
      multiplier: 1.08,
      fit: 0.82,
      note: '视觉中心落在你平时更愿意强调的位置。'
    }
  }

  if (inspirationItem.importance && inspirationItem.importance >= 4) {
    return {
      multiplier: profile.focalPointPreference === 'subtle' ? 0.82 : 0.94,
      fit: profile.focalPointPreference === 'subtle' ? 0.35 : 0.52,
      note: profile.focalPointPreference === 'subtle'
        ? '这处视觉中心比你日常更明显，适合作为拓展灵感。'
        : '视觉中心位置和你的日常偏好不完全一致。'
    }
  }

  return { multiplier: 1, fit: 0.6, note: null }
}

function getPracticalityFit(profile: PreferenceProfile | null, closetText: string) {
  if (!profile) {
    return { multiplier: 1, fit: 0.65, note: null as string | null }
  }

  const comfortTags = ['运动', '休闲', '宽松', '柔软', '针织', '平底', '舒适']
  const stylingTags = ['高跟', '紧身', '硬挺', '皮衣', '派对', '亮片']
  const comfortMatch = comfortTags.some((tag) => closetText.includes(tag))
  const stylingMatch = stylingTags.some((tag) => closetText.includes(tag))
  const comfortLeads = profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority
  const styleLeads = profile.practicalityPreference.stylePriority > profile.practicalityPreference.comfortPriority

  if (comfortLeads && stylingMatch && !comfortMatch) {
    return {
      multiplier: 0.88,
      fit: 0.42,
      note: '这件更偏造型感，舒适优先用户日常复刻时要谨慎。'
    }
  }

  if (comfortLeads && comfortMatch) {
    return {
      multiplier: 1.07,
      fit: 0.82,
      note: '这件更接近你的舒适优先偏好。'
    }
  }

  if (styleLeads && stylingMatch) {
    return {
      multiplier: 1.06,
      fit: 0.78,
      note: '这件更符合你的造型优先偏好。'
    }
  }

  return { multiplier: 1, fit: 0.62, note: null }
}

function missingSlots(...slots: TodayRecommendationMissingSlot[]) {
  return slots
}

function buildSingleItemOutfit(item: ClosetItemCardData, slot: InspirationOutfitSlot | 'unknown') {
  if (slot === 'top') {
    return { top: item, missingSlots: missingSlots('bottom', 'shoes', 'bag') }
  }

  if (slot === 'bottom') {
    return { bottom: item, missingSlots: missingSlots('top', 'shoes', 'bag') }
  }

  if (slot === 'onePiece') {
    return { dress: item, missingSlots: missingSlots('shoes', 'bag') }
  }

  if (slot === 'outerLayer') {
    return { outerLayer: item, missingSlots: missingSlots('top', 'bottom', 'shoes', 'bag') }
  }

  if (slot === 'shoes') {
    return { shoes: item, missingSlots: missingSlots('top', 'bottom', 'bag') }
  }

  if (slot === 'bag') {
    return { bag: item, missingSlots: missingSlots('top', 'bottom', 'shoes') }
  }

  return { accessories: [item], missingSlots: missingSlots('top', 'bottom', 'shoes', 'bag') }
}

function getMethodologyFit(
  profile: PreferenceProfile | null,
  finalWeights: ScoreWeights | null,
  closetItem: ClosetItemCardData,
  closetSlot: InspirationOutfitSlot | 'unknown'
) {
  if (!finalWeights) {
    return { multiplier: 1, fit: 0.65 }
  }

  const componentScores = evaluateOutfit(
    buildSingleItemOutfit(closetItem, closetSlot),
    { profile }
  ).componentScores
  const fit = clamp(getWeightedOutfitScore(componentScores, finalWeights) / 100, 0, 1)

  return {
    multiplier: clamp(0.86 + fit * 0.28, 0.9, 1.12),
    fit
  }
}

function buildPreferenceAdjustment({
  profile,
  inspirationItem,
  closetItem,
  closetSlot,
  closetLayerRole,
  silhouetteTokens,
  closetText,
  finalWeights
}: {
  profile: PreferenceProfile | null
  inspirationItem: InspirationKeyItem
  closetItem: ClosetItemCardData
  closetSlot: InspirationOutfitSlot | 'unknown'
  closetLayerRole: InspirationLayerRole
  silhouetteTokens: string[]
  closetText: string
  finalWeights: ScoreWeights | null
}) {
  if (!profile) {
    return {
      multiplier: 1,
      distanceFromDailyStyle: 0.35,
      tooFarForDaily: false,
      notes: [] as string[]
    }
  }

  const colorFit = getColorPreferenceFit(profile, closetItem, inspirationItem)
  const silhouetteFit = getSilhouettePreferenceFit(profile, silhouetteTokens, closetText)
  const layerFit = getLayerPreferenceFit(profile, inspirationItem, closetLayerRole)
  const focalFit = getFocalPreferenceFit(profile, inspirationItem, closetSlot)
  const practicalityFit = getPracticalityFit(profile, closetText)
  const methodologyFit = getMethodologyFit(profile, finalWeights, closetItem, closetSlot)
  const fit =
    colorFit.fit * 0.3 +
    silhouetteFit.fit * 0.2 +
    layerFit.fit * 0.15 +
    focalFit.fit * 0.2 +
    practicalityFit.fit * 0.1 +
    methodologyFit.fit * 0.05
  const distanceFromDailyStyle = clamp(1 - fit, 0, 1)
  const tooFarForDaily = distanceFromDailyStyle > profile.exploration.maxDistanceFromDailyStyle + 0.22
  const explorationMultiplier = tooFarForDaily ? 0.58 : distanceFromDailyStyle > profile.exploration.maxDistanceFromDailyStyle ? 0.82 : 1
  const multiplier = clamp(
    colorFit.multiplier *
      silhouetteFit.multiplier *
      layerFit.multiplier *
      focalFit.multiplier *
      practicalityFit.multiplier *
      methodologyFit.multiplier *
      explorationMultiplier,
    0.42,
    1.28
  )
  const notes = [colorFit.note, silhouetteFit.note, layerFit.note, focalFit.note, practicalityFit.note]
    .filter((note): note is string => Boolean(note))

  if (tooFarForDaily) {
    notes.push('整体离你的日常风格距离较远，不建议直接作为日常复刻，可先作为灵感参考。')
  } else if (distanceFromDailyStyle > profile.exploration.maxDistanceFromDailyStyle) {
    notes.push('这套比你的日常风格稍微拓展一点，但仍可作为灵感尝试。')
  }

  return { multiplier, distanceFromDailyStyle, tooFarForDaily, notes }
}

function scoreClosetItem(
  inspirationItem: InspirationKeyItem,
  closetItem: ClosetItemCardData,
  context: PreferenceScoreContext
): ScoredClosetItem {
  const normalizedInspirationCategory = normalizeCategoryValue(inspirationItem.category)
  const normalizedClosetCategory = normalizeCategoryValue(closetItem.category)
  const inspirationSlot = normalizeSlot(inspirationItem.slot, inspirationItem.category)
  const closetSlot = inferSlotFromItem(closetItem)
  const closetText = itemSearchText(closetItem)
  const layerRole = inspirationItem.layerRole
  const closetLayerRole = inferLayerRole(closetItem)
  const rawColorScore = scoreFormulaColorMatch(inspirationItem.colorHint, closetItem.colorCategory)
  const sharedTagCount = countSharedTags(closetItem.styleTags, inspirationItem.styleTags)
  const styleDenominator = Math.max(1, Math.min(3, inspirationItem.styleTags.length))
  const silhouetteTokens = splitFormulaTokens(inspirationItem.silhouette)
  const silhouetteMatchCount = silhouetteTokens.filter((token) => closetText.includes(token)).length
  const blockedByHardAvoid = context.profile?.hardAvoids
    ? includesAnyNeedle(`${closetText} ${keyItemSearchText(inspirationItem)}`, context.profile.hardAvoids)
    : false
  const preferenceAdjustment = buildPreferenceAdjustment({
    profile: context.profile,
    inspirationItem,
    closetItem,
    closetSlot,
    closetLayerRole,
    silhouetteTokens,
    closetText,
    finalWeights: context.finalWeights
  })
  const categoryScore = normalizedClosetCategory === normalizedInspirationCategory ? context.weights.categoryScore : 0
  const slotScore = closetSlot === inspirationSlot ? context.weights.slotScore : 0
  const colorScore = rawColorScore * context.weights.colorScore
  const silhouetteScore = silhouetteTokens.length > 0
    ? (silhouetteMatchCount / silhouetteTokens.length) * context.weights.silhouetteScore
    : 0
  const styleScore = (Math.min(sharedTagCount, styleDenominator) / styleDenominator) * context.weights.styleScore
  const layerRoleScore = layerRole && layerRole === closetLayerRole ? context.weights.layerRoleScore : 0
  const baseTotal = categoryScore + slotScore + colorScore + silhouetteScore + styleScore + layerRoleScore
  const total = blockedByHardAvoid ? 0 : baseTotal * preferenceAdjustment.multiplier
  const matchType = normalizedClosetCategory === normalizedInspirationCategory ? 'sameCategory' : 'formulaSubstitute'
  const scoreBreakdown: InspirationMatchScoreBreakdown = {
    total,
    categoryScore,
    slotScore,
    colorScore,
    silhouetteScore,
    styleScore,
    layerRoleScore,
    preferenceAdjustment: blockedByHardAvoid ? 0 : preferenceAdjustment.multiplier,
    distanceFromDailyStyle: preferenceAdjustment.distanceFromDailyStyle,
    blockedByHardAvoid,
    matchType
  }

  return {
    item: closetItem,
    score: total,
    scoreBreakdown,
    exactCategory: normalizedClosetCategory === normalizedInspirationCategory,
    sameSlot: closetSlot === inspirationSlot,
    blockedByHardAvoid,
    tooFarForDaily: preferenceAdjustment.tooFarForDaily,
    preferenceNotes: blockedByHardAvoid
      ? ['这件命中了你的 hard avoids，已从可复刻推荐里过滤。']
      : preferenceAdjustment.notes
  }
}

function buildMatchReason({
  hasExactCategory,
  matchedItems,
  inspirationItem,
  blockedByHardAvoid,
  hasPreferenceState
}: {
  hasExactCategory: boolean
  matchedItems: ClosetItemCardData[]
  inspirationItem: InspirationKeyItem
  blockedByHardAvoid: boolean
  hasPreferenceState: boolean
}) {
  if (blockedByHardAvoid) {
    return `“${inspirationItem.label}”命中了你的 hard avoids，本次不推荐作为日常复刻。`
  }

  if (matchedItems.length === 0) {
    return `暂时没有能稳定承接“${inspirationItem.label}”公式角色的单品。`
  }

  if (hasExactCategory) {
    return hasPreferenceState
      ? '同类替代：先保留公式匹配，再按你的颜色、轮廓、叠穿、视觉中心和舒适度偏好轻微调整排序。'
      : '同类替代：按类别 35%、slot 15%、颜色 20%、轮廓 15%、风格 10%、层次 5% 加权排序。'
  }

  return hasPreferenceState
    ? '公式替代：没有同类单品时仍允许适度偏离，但会避开 hard avoids，并按你的日常偏好控制偏离距离。'
    : '公式替代：衣橱里没有同类单品，先按 slot、颜色、轮廓、风格或层次角色找替代。'
}

function buildPreferenceNote(entry: ScoredClosetItem | undefined) {
  if (!entry || entry.preferenceNotes.length === 0) {
    return null
  }

  return entry.preferenceNotes.slice(0, 2).join(' ')
}

function buildSubstituteSuggestion(inspirationItem: InspirationKeyItem, matchedItems: ClosetItemCardData[], hasExactCategory: boolean, preferenceNote: string | null) {
  if (hasExactCategory) {
    return null
  }

  const alternatives = inspirationItem.alternatives ?? []
  const alternativeText = alternatives.length > 0 ? ` 可替代方向：${alternatives.join(' / ')}。` : ''

  if (matchedItems.length > 0) {
    return `没有同类单品时，先用这些相近单品保住${inspirationItem.slot ? ` ${inspirationItem.slot} slot` : '相同穿搭位置'}、颜色/轮廓和整体公式。${preferenceNote ? ` ${preferenceNote}` : ''}${alternativeText}`.trim()
  }

  return `没有同类单品，也没有足够接近的替代；先记住它承担的是“${inspirationItem.layerRole ?? inspirationItem.slot ?? inspirationItem.category}”角色。${preferenceNote ? ` ${preferenceNote}` : ''}${alternativeText}`.trim()
}

function canUseFormulaSubstitute(inspirationSlot: InspirationOutfitSlot | 'unknown', entry: ScoredClosetItem) {
  if (entry.exactCategory || entry.sameSlot) {
    return true
  }

  if (inspirationSlot === 'accessory') {
    return true
  }

  return inspirationSlot === 'unknown'
}

export function matchClosetToInspiration(
  breakdown: InspirationBreakdown,
  closetItems: ClosetItemCardData[],
  preferenceState?: RecommendationPreferenceState | null
): InspirationClosetMatch[] {
  const context = buildPreferenceContext(preferenceState)

  return breakdown.keyItems.map((inspirationItem) => {
    const normalizedCategory = normalizeCategoryValue(inspirationItem.category)
    const inspirationSlot = normalizeSlot(inspirationItem.slot, inspirationItem.category)
    const scoredItems = closetItems
      .map((item) => scoreClosetItem(inspirationItem, item, context))
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
      preferenceAdjustment: 1,
      distanceFromDailyStyle: 0,
      blockedByHardAvoid: false,
      matchType: 'missing' as const
    }
    const matchedEntries = scoredItems
      .filter((entry) => !entry.blockedByHardAvoid)
      .filter((entry) => !entry.tooFarForDaily)
      .filter((entry) => canUseFormulaSubstitute(inspirationSlot, entry))
      .filter((entry) => entry.score >= (hasExactCategory ? 0.32 : 0.22))
      .slice(0, 2)
    const matchedItems = matchedEntries
      .map((entry) => entry.item)
    const bestEntry = matchedEntries[0] ?? scoredItems[0]
    const preferenceNote = buildPreferenceNote(bestEntry)
    const blockedByHardAvoid = scoredItems.length > 0 && scoredItems.every((entry) => entry.blockedByHardAvoid)

    return {
      inspirationItem,
      matchedItems,
      matchReason: buildMatchReason({
        hasExactCategory,
        matchedItems,
        inspirationItem,
        blockedByHardAvoid,
        hasPreferenceState: Boolean(preferenceState)
      }),
      substituteSuggestion: buildSubstituteSuggestion(inspirationItem, matchedItems, hasExactCategory, preferenceNote),
      preferenceNote,
      scoreBreakdown: matchedEntries[0]?.scoreBreakdown ?? bestScoreBreakdown
    }
  })
}
