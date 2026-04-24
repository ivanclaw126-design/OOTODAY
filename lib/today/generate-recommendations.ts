import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  isAccessoryCategory,
  isBagCategory,
  isBottomCategory,
  isNeutralColor,
  isOnePieceCategory,
  isOuterwearCategory,
  isShoesCategory,
  isTopCategory,
  isVividColor,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'
import { buildInspirationAttemptLabel, buildMissingSlotCopy, buildRecommendationColorNotes } from '@/lib/recommendation/copy'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { isGoodInspirationCandidate, pickDeterministicInspirationCandidate, shouldShowInspiration } from '@/lib/recommendation/exploration'
import {
  evaluateOutfit,
  filterWeatherSuitableItems,
  getItemFreshnessScore,
  getItemWeatherSuitability,
  getWeightedOutfitScore,
  rankItemsForRecommendation
} from '@/lib/recommendation/outfit-evaluator'
import type { InspirationCandidateSignals, PreferenceProfile, RecommendationPreferenceState, ScoreWeights } from '@/lib/recommendation/preference-types'
import type {
  TodayRecommendation,
  TodayRecommendationItem,
  TodayRecommendationMissingSlot,
  TodayWeather
} from '@/lib/today/types'

type RecommendationCandidate = {
  recommendation: TodayRecommendation
  mainIds: string[]
  score: number
  draft: OutfitDraft
}

export type GenerateTodayRecommendationsParams = {
  items: ClosetItemCardData[]
  weather: TodayWeather | null
  offset?: number
  preferenceState?: RecommendationPreferenceState
  explorationSeed?: string
}

type OutfitKind = 'separates' | 'onePiece' | 'partial'

type OutfitDraft = {
  id: string
  outfitKind: OutfitKind
  top: ClosetItemCardData | null
  bottom: ClosetItemCardData | null
  dress: ClosetItemCardData | null
  outerLayer: ClosetItemCardData | null
  shoes: ClosetItemCardData | null
  bag: ClosetItemCardData | null
  accessories: ClosetItemCardData[]
  missingSlots: TodayRecommendationMissingSlot[]
  mainIds: string[]
}

function toRecommendationItem(item: ClosetItemCardData): TodayRecommendationItem {
  return {
    id: item.id,
    imageUrl: item.imageUrl,
    category: item.category,
    subCategory: item.subCategory,
    colorCategory: item.colorCategory,
    styleTags: item.styleTags
  }
}

function buildReason(parts: string[]) {
  return parts.filter(Boolean).join('，')
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function buildTodayColorNotes(colors: Array<string | null | undefined>) {
  return buildRecommendationColorNotes(colors, 'today').map((note) => note.replace(/。$/u, ''))
}

function compareWearPriority(a: ClosetItemCardData, b: ClosetItemCardData) {
  if (!a.lastWornDate && !b.lastWornDate) {
    if (a.wearCount !== b.wearCount) {
      return a.wearCount - b.wearCount
    }

    return b.createdAt.localeCompare(a.createdAt)
  }

  if (!a.lastWornDate) {
    return -1
  }

  if (!b.lastWornDate) {
    return 1
  }

  if (a.lastWornDate !== b.lastWornDate) {
    return a.lastWornDate.localeCompare(b.lastWornDate)
  }

  if (a.wearCount !== b.wearCount) {
    return a.wearCount - b.wearCount
  }

  return b.createdAt.localeCompare(a.createdAt)
}

function countSharedStyleTags(a: string[], b: string[]) {
  return a.filter((tag) => b.includes(tag)).length
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

function hasAnyTextToken(item: ClosetItemCardData, tokens: string[]) {
  const text = itemSearchText(item)
  return tokens.some((token) => text.includes(token))
}

function getSceneMatchScore(item: ClosetItemCardData, profile: PreferenceProfile) {
  const sceneTags: Record<PreferenceProfile['preferredScenes'][number], string[]> = {
    work: ['通勤', '正式', '商务', '乐福', '皮鞋', '托特', '电脑'],
    casual: ['休闲', '基础', '极简', '帆布', '运动'],
    date: ['约会', '优雅', '甜美', '小包', '单肩'],
    travel: ['旅行', '轻便', '舒适', '双肩', '斜挎'],
    outdoor: ['户外', '运动', '防风', '徒步', '防水'],
    party: ['派对', '亮片', '华丽', '金属']
  }
  const wantedTokens = profile.preferredScenes.flatMap((scene) => sceneTags[scene] ?? [])

  if (wantedTokens.length === 0) {
    return 0
  }

  return hasAnyTextToken(item, wantedTokens) ? 6 : 0
}

function getWeatherMatchScore(item: ClosetItemCardData, weather: TodayWeather | null) {
  if (!weather) {
    return 0
  }

  return (getItemWeatherSuitability(item, weather) - 70) / 5
}

function getWearFreshnessScore(item: ClosetItemCardData) {
  return getItemFreshnessScore(item) / 10
}

function average(numbers: number[]) {
  if (numbers.length === 0) {
    return 0
  }

  return numbers.reduce((sum, item) => sum + item, 0) / numbers.length
}

function getSelectedItems(draft: OutfitDraft) {
  return [
    draft.dress,
    draft.top,
    draft.bottom,
    draft.outerLayer,
    draft.shoes,
    draft.bag,
    ...draft.accessories
  ].filter((item): item is ClosetItemCardData => item !== null)
}

function shouldUseOuterLayer(
  weather: TodayWeather | null,
  profile: PreferenceProfile
) {
  if (weather?.isCold) {
    return true
  }

  if (weather?.isWarm) {
    return false
  }

  if (weather && isMildCoolWeather(weather)) {
    return profile.slotPreference.outerwear
  }

  return profile.slotPreference.outerwear && profile.layeringPreference.allowNonWeatherOuterwear && profile.layeringPreference.complexity >= 2
}

function isMildCoolWeather(weather: TodayWeather) {
  return weather.temperatureC >= 13 && weather.temperatureC <= 18
}

function pickBestMatchingItem({
  referenceItems,
  candidates,
  profile,
  weather,
  includeScene = false,
  includeWeather = false
}: {
  referenceItems: ClosetItemCardData[]
  candidates: ClosetItemCardData[]
  profile: PreferenceProfile
  weather: TodayWeather | null
  includeScene?: boolean
  includeWeather?: boolean
}) {
  if (candidates.length === 0) {
    return null
  }

  return [...candidates].sort((left, right) => {
    const scoreItem = (item: ClosetItemCardData) => {
      const colorScore = average(referenceItems.map((reference) => scoreColorCompatibility(item.colorCategory, reference.colorCategory))) * 4
      const styleScore = average(referenceItems.map((reference) => countSharedStyleTags(item.styleTags, reference.styleTags))) * 3
      const sceneScore = includeScene ? getSceneMatchScore(item, profile) : 0
      const weatherScore = includeWeather ? getWeatherMatchScore(item, weather) : 0
      return colorScore + styleScore + sceneScore + weatherScore + getWearFreshnessScore(item)
    }
    const scoreDelta = scoreItem(right) - scoreItem(left)

    if (scoreDelta !== 0) {
      return scoreDelta
    }

    return compareWearPriority(left, right)
  })[0] ?? null
}

function pickAccessories(
  referenceItems: ClosetItemCardData[],
  accessories: ClosetItemCardData[]
) {
  return [...accessories]
    .sort((left, right) => {
      const leftScore = average(referenceItems.map((reference) => scoreColorCompatibility(left.colorCategory, reference.colorCategory))) + getWearFreshnessScore(left)
      const rightScore = average(referenceItems.map((reference) => scoreColorCompatibility(right.colorCategory, reference.colorCategory))) + getWearFreshnessScore(right)

      if (rightScore !== leftScore) {
        return rightScore - leftScore
      }

      return compareWearPriority(left, right)
    })
    .slice(0, 2)
}

function buildCoreReferenceItems(draft: OutfitDraft) {
  return [draft.dress, draft.top, draft.bottom].filter((item): item is ClosetItemCardData => item !== null)
}

function addCompletionSlots({
  draft,
  outerLayers,
  shoes,
  bags,
  accessories,
  weather,
  profile
}: {
  draft: OutfitDraft
  outerLayers: ClosetItemCardData[]
  shoes: ClosetItemCardData[]
  bags: ClosetItemCardData[]
  accessories: ClosetItemCardData[]
  weather: TodayWeather | null
  profile: PreferenceProfile
}) {
  const coreItems = buildCoreReferenceItems(draft)
  const wantsOuterLayer = shouldUseOuterLayer(weather, profile)

  if (wantsOuterLayer) {
    draft.outerLayer = pickBestMatchingItem({
      referenceItems: coreItems,
      candidates: outerLayers,
      profile,
      weather,
      includeScene: true,
      includeWeather: true
    })

    if (!draft.outerLayer) {
      draft.missingSlots.push('outerLayer')
    }
  }

  const referenceItems = [...coreItems, draft.outerLayer].filter((item): item is ClosetItemCardData => item !== null)

  if (profile.slotPreference.shoes) {
    draft.shoes = pickBestMatchingItem({
      referenceItems,
      candidates: shoes,
      profile,
      weather,
      includeScene: true,
      includeWeather: true
    })

    if (!draft.shoes) {
      draft.missingSlots.push('shoes')
    }
  }

  if (profile.slotPreference.bag) {
    draft.bag = pickBestMatchingItem({
      referenceItems,
      candidates: bags,
      profile,
      weather,
      includeScene: true
    })

    if (!draft.bag) {
      draft.missingSlots.push('bag')
    }
  }

  if (profile.slotPreference.accessories) {
    draft.accessories = pickAccessories(referenceItems, accessories)

    if (draft.accessories.length === 0) {
      draft.missingSlots.push('accessories')
    }
  }

  return draft
}

function buildComponentScores(draft: OutfitDraft, weather: TodayWeather | null, profile: PreferenceProfile): ScoreWeights {
  return evaluateOutfit(draft, { weather, profile }).componentScores
}

function getFinalScore(componentScores: ScoreWeights, weights: ScoreWeights) {
  return getWeightedOutfitScore(componentScores, weights)
}

function buildPairReason(draft: OutfitDraft, weather: TodayWeather | null) {
  const top = draft.top
  const bottom = draft.bottom
  const parts: string[] = []

  if (!top || !bottom) {
    return buildReason([
      weather?.isCold ? '天气偏冷，先从已有单品开始，后续补齐外层和下装' : '',
      '先用已有单品起一套思路'
    ])
  }

  const sharedTag = top.styleTags.find((tag) => bottom.styleTags.includes(tag))

  if (weather?.isWarm) {
    parts.push('天气偏暖，优先轻量组合')
  }

  if (weather?.isCold) {
    parts.push(draft.outerLayer ? '天气偏冷，已补上外层' : '天气偏冷，建议补一件外层')
  } else if (weather && isMildCoolWeather(weather)) {
    parts.push(draft.outerLayer ? '天气微凉，已补轻外层' : '天气微凉，建议补一件轻外层')
  }

  parts.push(...buildTodayColorNotes(getSelectedItems(draft).map((item) => item.colorCategory)))

  if (!parts.some((part) => part.includes('同色系') || part.includes('基础色') || part.includes('亮色'))) {
    const colorScore = scoreColorCompatibility(top.colorCategory, bottom.colorCategory)

    if (colorScore >= 2) {
      parts.push('颜色有呼应，日常直接穿也不容易出错')
    } else if (colorScore === 1) {
      parts.push('配色更有存在感，适合想要一点变化')
    } else {
      parts.push('先靠基础轮廓稳住，再用配饰补完成度')
    }
  }

  if (draft.shoes || draft.bag) {
    parts.push('鞋包已经补齐，出门完整度更高')
  }

  if (sharedTag) {
    parts.push(`风格统一在${sharedTag}`)
  } else if (isNeutralColor(top.colorCategory) || isNeutralColor(bottom.colorCategory)) {
    parts.push('中性色打底，容错率更高')
  }

  return buildReason(parts)
}

function buildMissingSlotReason(draft: OutfitDraft) {
  const missingFinishers = draft.missingSlots.filter((slot) => slot === 'shoes' || slot === 'bag' || slot === 'accessories')
  const parts: string[] = []

  if (missingFinishers.includes('shoes') && missingFinishers.includes('bag')) {
    parts.push(`${buildMissingSlotCopy('shoes', 'today')} ${buildMissingSlotCopy('bag', 'today')}`)
  } else if (missingFinishers.includes('shoes')) {
    parts.push(buildMissingSlotCopy('shoes', 'today'))
  } else if (missingFinishers.includes('bag')) {
    parts.push(buildMissingSlotCopy('bag', 'today'))
  }

  if (missingFinishers.includes('accessories')) {
    parts.push(buildMissingSlotCopy('accessories', 'today'))
  }

  if (draft.missingSlots.includes('outerLayer')) {
    parts.push(buildMissingSlotCopy('outerLayer', 'today'))
  }

  return parts
}

function buildDressReason(draft: OutfitDraft, weather: TodayWeather | null) {
  const dress = draft.dress

  if (!dress) {
    return '先用已有单品起一套思路'
  }

  const parts = [
    weather?.isCold
      ? draft.outerLayer
        ? '天气偏冷，用外层补足保暖'
        : '天气偏冷，建议补一件外层'
      : weather && isMildCoolWeather(weather)
        ? draft.outerLayer
          ? '天气微凉，用轻外层处理温差'
          : '天气微凉，建议补一件轻外层'
      : '一件完成主造型，省决策成本',
    draft.outerLayer && scoreColorCompatibility(dress.colorCategory, draft.outerLayer.colorCategory) >= 2 ? '外层和主件颜色衔接自然' : '',
    ...buildTodayColorNotes(getSelectedItems(draft).map((item) => item.colorCategory)),
    isVividColor(dress.colorCategory) ? '主件颜色已经足够有重点，其他部分可以收一收' : '',
    draft.shoes || draft.bag ? '鞋包补上后完成度更稳' : '',
    dress.styleTags[0] ? `风格偏${dress.styleTags[0]}` : ''
  ]

  return buildReason(parts)
}

function toRecommendation(draft: OutfitDraft, componentScores: ScoreWeights, score: number, weather: TodayWeather | null): TodayRecommendation {
  const confidence = clampScore(componentScores.completeness * 0.52 + score * 0.48)
  const coreReason = draft.outfitKind === 'onePiece' ? buildDressReason(draft, weather) : buildPairReason(draft, weather)

  return {
    id: draft.id,
    reason: buildReason([coreReason, ...buildMissingSlotReason(draft)]),
    top: draft.top ? toRecommendationItem(draft.top) : null,
    bottom: draft.bottom ? toRecommendationItem(draft.bottom) : null,
    dress: draft.dress ? toRecommendationItem(draft.dress) : null,
    outerLayer: draft.outerLayer ? toRecommendationItem(draft.outerLayer) : null,
    shoes: draft.shoes ? toRecommendationItem(draft.shoes) : null,
    bag: draft.bag ? toRecommendationItem(draft.bag) : null,
    accessories: draft.accessories.map(toRecommendationItem),
    missingSlots: draft.missingSlots,
    confidence,
    componentScores,
    mode: 'daily',
    inspirationReason: null,
    dailyDifference: null
  }
}

function buildRecommendationCandidates(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  preferenceState?: RecommendationPreferenceState
) {
  const profile = preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE
  const weights = preferenceState?.finalWeights ?? DEFAULT_RECOMMENDATION_WEIGHTS
  const rankContext = { weather, profile }
  const tops = rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isTopCategory(item.category)), weather, 46),
    rankContext
  )
  const bottoms = rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isBottomCategory(item.category)), weather, 52),
    rankContext
  )
  const dresses = rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isOnePieceCategory(item.category)), weather, 50),
    rankContext
  )
  const outerLayers = rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isOuterwearCategory(item.category)), weather, 45),
    rankContext
  )
  const shoes = rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isShoesCategory(item.category)), weather, 52),
    rankContext
  )
  const bags = rankItemsForRecommendation(items.filter((item) => isBagCategory(item.category)), rankContext)
  const accessories = rankItemsForRecommendation(items.filter((item) => isAccessoryCategory(item.category)), rankContext)
  const candidates: RecommendationCandidate[] = []
  const finishDraft = (draft: OutfitDraft) => {
    const completedDraft = addCompletionSlots({
      draft,
      outerLayers,
      shoes,
      bags,
      accessories,
      weather,
      profile
    })
    const componentScores = buildComponentScores(completedDraft, weather, profile)
    const score = getFinalScore(componentScores, weights)

    candidates.push({
      score,
      mainIds: completedDraft.mainIds,
      draft: completedDraft,
      recommendation: toRecommendation(completedDraft, componentScores, score, weather)
    })
  }

  for (const dress of dresses) {
    finishDraft({
      id: `dress-${dress.id}`,
      outfitKind: 'onePiece',
      top: null,
      bottom: null,
      dress,
      outerLayer: null,
      shoes: null,
      bag: null,
      accessories: [],
      missingSlots: [],
      mainIds: [dress.id]
    })
  }

  for (const top of tops) {
    for (const bottom of bottoms) {
      finishDraft({
        id: `set-${top.id}-${bottom.id}`,
        outfitKind: 'separates',
        top,
        bottom,
        dress: null,
        outerLayer: null,
        shoes: null,
        bag: null,
        accessories: [],
        missingSlots: [],
        mainIds: [top.id, bottom.id]
      })
    }
  }

  for (const top of tops) {
    finishDraft({
      id: `single-${top.id}`,
      outfitKind: 'partial',
      top,
      bottom: null,
      dress: null,
      outerLayer: null,
      shoes: null,
      bag: null,
      accessories: [],
      missingSlots: ['bottom'],
      mainIds: [top.id]
    })
  }

  for (const bottom of bottoms) {
    finishDraft({
      id: `single-${bottom.id}`,
      outfitKind: 'partial',
      top: null,
      bottom,
      dress: null,
      outerLayer: null,
      shoes: null,
      bag: null,
      accessories: [],
      missingSlots: ['top'],
      mainIds: [bottom.id]
    })
  }

  return candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return left.recommendation.id.localeCompare(right.recommendation.id)
  })
}

function getFocalPointCount(draft: OutfitDraft) {
  const selectedItems = getSelectedItems(draft)
  const vividCount = selectedItems.filter((item) => isVividColor(item.colorCategory)).length
  const accessoryFocusCount = [draft.shoes, draft.bag, ...draft.accessories].filter((item) => item && !isNeutralColor(item.colorCategory)).length

  return Math.max(1, vividCount + accessoryFocusCount)
}

function getDistanceFromDailyStyle(candidate: RecommendationCandidate, profile: PreferenceProfile) {
  const selectedItems = getSelectedItems(candidate.draft)
  const selectedTags = selectedItems.flatMap((item) => item.styleTags)
  const sceneTags: Record<PreferenceProfile['preferredScenes'][number], string[]> = {
    work: ['通勤', '正式', '商务'],
    casual: ['休闲', '基础', '极简'],
    date: ['约会', '优雅', '甜美'],
    travel: ['旅行', '休闲', '轻便'],
    outdoor: ['户外', '运动', '防风'],
    party: ['派对', '亮片', '华丽']
  }
  const preferredTags = profile.preferredScenes.flatMap((scene) => sceneTags[scene] ?? [])
  const hasPreferredSceneTag = selectedTags.some((tag) => preferredTags.includes(tag))
  const vividCount = selectedItems.filter((item) => isVividColor(item.colorCategory)).length
  let distance = 0.16

  if (!hasPreferredSceneTag) {
    distance += 0.12
  }

  if (vividCount > profile.colorPreference.accentTolerance) {
    distance += 0.12
  }

  if (candidate.draft.outerLayer && !profile.slotPreference.outerwear) {
    distance += 0.06
  }

  if (candidate.draft.bag && profile.focalPointPreference !== 'bagAccessory') {
    distance += 0.04
  }

  if (candidate.draft.shoes && profile.focalPointPreference !== 'shoes') {
    distance += 0.04
  }

  return Math.min(1, distance)
}

function toInspirationSignal(candidate: RecommendationCandidate, profile: PreferenceProfile, weather: TodayWeather | null): InspirationCandidateSignals {
  const selectedTags = getSelectedItems(candidate.draft).flatMap((item) => item.styleTags)

  return {
    id: candidate.recommendation.id,
    styleTags: selectedTags,
    hardAvoidTags: selectedTags,
    colorHarmony: candidate.recommendation.componentScores?.colorHarmony,
    focalPointCount: getFocalPointCount(candidate.draft),
    sceneFit: candidate.recommendation.componentScores?.sceneFit,
    weatherComfort: candidate.recommendation.componentScores?.weatherComfort,
    distanceFromDailyStyle: getDistanceFromDailyStyle(candidate, profile),
    isFormalScene: profile.preferredScenes.includes('work'),
    isSevereWeather: Boolean(weather?.isCold)
  }
}

function buildInspirationDifference(candidate: RecommendationCandidate, profile: PreferenceProfile) {
  const selectedItems = getSelectedItems(candidate.draft)
  const vividItem = selectedItems.find((item) => isVividColor(item.colorCategory))

  if (profile.focalPointPreference !== 'shoes' && candidate.draft.shoes) {
    return '比你的日常偏好更强调鞋履存在感，但颜色和场景仍在安全范围内。'
  }

  if (profile.focalPointPreference !== 'bagAccessory' && (candidate.draft.bag || candidate.draft.accessories.length > 0)) {
    return '比你的日常搭配更重视包袋或配饰细节，适合小幅试新。'
  }

  if (vividItem) {
    return `比你的日常色彩更有重点，把${vividItem.colorCategory}控制在一处来试新。`
  }

  if (!profile.slotPreference.outerwear && candidate.draft.outerLayer) {
    return '比你的日常组合多一层外层，适合尝试更完整的层次。'
  }

  return '比你的日常推荐多一点变化，但没有越过避雷、天气和场景底线。'
}

function toInspirationRecommendation(candidate: RecommendationCandidate, profile: PreferenceProfile): TodayRecommendation {
  return {
    ...candidate.recommendation,
    id: `inspiration-${candidate.recommendation.id}`,
    mode: 'inspiration',
    inspirationReason: `低频${buildInspirationAttemptLabel()}`,
    dailyDifference: buildInspirationDifference(candidate, profile)
  }
}

function buildRecommendationBatch(candidates: RecommendationCandidate[], offset: number) {
  if (candidates.length === 0) {
    return []
  }

  const windowStart = (Math.max(0, offset) * 3) % candidates.length
  const rotatedCandidates = [...candidates.slice(windowStart), ...candidates.slice(0, windowStart)]
  const selected: TodayRecommendation[] = []
  const usedMainIds = new Set<string>()

  for (const candidate of rotatedCandidates) {
    const conflicts = candidate.mainIds.some((id) => usedMainIds.has(id))

    if (conflicts && rotatedCandidates.length > 3) {
      continue
    }

    selected.push(candidate.recommendation)
    candidate.mainIds.forEach((id) => usedMainIds.add(id))

    if (selected.length === 3) {
      return selected
    }
  }

  for (const candidate of rotatedCandidates) {
    if (selected.some((item) => item.id === candidate.recommendation.id)) {
      continue
    }

    selected.push(candidate.recommendation)

    if (selected.length === 3) {
      return selected
    }
  }

  return selected
}

function maybeInsertInspirationRecommendation({
  recommendations,
  candidates,
  preferenceState,
  weather,
  offset,
  explorationSeed
}: {
  recommendations: TodayRecommendation[]
  candidates: RecommendationCandidate[]
  preferenceState?: RecommendationPreferenceState
  weather: TodayWeather | null
  offset: number
  explorationSeed?: string
}) {
  if (!preferenceState) {
    return recommendations
  }

  const profile = preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE
  const selectedIds = new Set(recommendations.map((recommendation) => recommendation.id))
  const candidatePool = candidates.filter((candidate) => !selectedIds.has(candidate.recommendation.id))
  const inspirationPool = candidatePool.length > 0 ? candidatePool : candidates
  const signals = inspirationPool
    .map((candidate) => toInspirationSignal(candidate, profile, weather))
    .filter((signal) => isGoodInspirationCandidate(signal, profile))

  if (!shouldShowInspiration({
    profile,
    seed: `${explorationSeed ?? 'today'}:${offset}:show`,
    candidateCount: signals.length,
    alreadyShownToday: recommendations.some((recommendation) => recommendation.mode === 'inspiration')
  })) {
    return recommendations
  }

  const selectedSignal = pickDeterministicInspirationCandidate(signals, profile, `${explorationSeed ?? 'today'}:${offset}:pick`)
  const selectedCandidate = selectedSignal
    ? inspirationPool.find((candidate) => candidate.recommendation.id === selectedSignal.id)
    : null

  if (!selectedCandidate) {
    return recommendations
  }

  const inspirationRecommendation = toInspirationRecommendation(selectedCandidate, profile)
  const dailyRecommendations = recommendations.filter((recommendation) => recommendation.mode !== 'inspiration')

  if (dailyRecommendations.length >= 3) {
    return [...dailyRecommendations.slice(0, 2), inspirationRecommendation]
  }

  return [...dailyRecommendations, inspirationRecommendation].slice(0, 3)
}

export function generateTodayRecommendations(
  params: GenerateTodayRecommendationsParams
): TodayRecommendation[] {
  const { items, weather, preferenceState, explorationSeed } = params
  const offset = params.offset ?? 0
  const candidates = buildRecommendationCandidates(items, weather, preferenceState)
  const recommendations = buildRecommendationBatch(candidates, offset)

  while (recommendations.length < 3 && recommendations.length > 0) {
    const seed = recommendations[recommendations.length % Math.max(1, recommendations.length)]
    recommendations.push({
      ...seed,
      id: `${seed.id}-alt-${recommendations.length}`,
      reason: `${seed.reason}，适合换一套思路`
    })
  }

  return maybeInsertInspirationRecommendation({
    recommendations,
    candidates,
    preferenceState,
    weather,
    offset,
    explorationSeed
  }).slice(0, 3)
}
