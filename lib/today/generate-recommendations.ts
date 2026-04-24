import type { ClosetItemCardData } from '@/lib/closet/types'
import { buildPaletteColorStrategyNotes } from '@/lib/closet/color-strategy'
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
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import type { PreferenceProfile, RecommendationPreferenceState, ScoreWeights } from '@/lib/recommendation/preference-types'
import type {
  TodayRecommendation,
  TodayRecommendationItem,
  TodayRecommendationMissingSlot,
  TodayRecommendationMode,
  TodayWeather
} from '@/lib/today/types'

type RecommendationCandidate = {
  recommendation: TodayRecommendation
  mainIds: string[]
  score: number
}

type GenerateTodayRecommendationsParams = {
  items: ClosetItemCardData[]
  weather: TodayWeather | null
  offset?: number
  preferenceState?: RecommendationPreferenceState
}

type OutfitDraft = {
  id: string
  mode: TodayRecommendationMode
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
  return buildPaletteColorStrategyNotes(colors).map((note) =>
    note
      .replace('这套主要靠同色系深浅变化成立，不是靠大撞色取胜。', '同色系深浅搭配，层次更自然')
      .replace('这套有基础色托底，所以整体看起来更稳、更容易穿进日常。', '用基础色做主轴，整套更稳')
      .replace('基础色占比够高，更容易把少量单品反复穿出稳定组合。', '基础色比例稳，重复穿也不容易乱')
      .replace('同色系单品之间能形成自然轮换，少带几件也不容易显乱。', '同色系轮换更自然，整套层次会更顺')
      .replace('亮点色基本只保留在一处，所以视觉重点会更清楚。', '把亮色控制在一处，重点更清楚')
      .replace('重点色不止一处，使用时记得别让多个亮点同时抢戏。', '重点不止一处，记得别让多个亮点同时抢戏')
      .replace(/。$/, '')
  )
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

function getWearFreshnessScore(item: ClosetItemCardData) {
  let score = 0

  if (!item.lastWornDate) {
    score += 8
  }

  score += Math.max(0, 4 - item.wearCount)

  return score
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

  return profile.slotPreference.outerwear && profile.layeringPreference.allowNonWeatherOuterwear && profile.layeringPreference.complexity >= 2
}

function pickBestMatchingItem(
  referenceItems: ClosetItemCardData[],
  candidates: ClosetItemCardData[]
) {
  if (candidates.length === 0) {
    return null
  }

  return [...candidates].sort((left, right) => {
    const scoreItem = (item: ClosetItemCardData) => {
      const colorScore = average(referenceItems.map((reference) => scoreColorCompatibility(item.colorCategory, reference.colorCategory))) * 4
      const styleScore = average(referenceItems.map((reference) => countSharedStyleTags(item.styleTags, reference.styleTags))) * 3
      return colorScore + styleScore + getWearFreshnessScore(item)
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
    draft.outerLayer = pickBestMatchingItem(coreItems, outerLayers)

    if (!draft.outerLayer) {
      draft.missingSlots.push('outerLayer')
    }
  }

  const referenceItems = [...coreItems, draft.outerLayer].filter((item): item is ClosetItemCardData => item !== null)

  if (profile.slotPreference.shoes) {
    draft.shoes = pickBestMatchingItem(referenceItems, shoes)

    if (!draft.shoes) {
      draft.missingSlots.push('shoes')
    }
  }

  if (profile.slotPreference.bag) {
    draft.bag = pickBestMatchingItem(referenceItems, bags)

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

function scoreColorHarmony(draft: OutfitDraft) {
  const selectedItems = getSelectedItems(draft)

  if (selectedItems.length <= 1) {
    return 62
  }

  const pairScores: number[] = []

  for (let left = 0; left < selectedItems.length; left += 1) {
    for (let right = left + 1; right < selectedItems.length; right += 1) {
      pairScores.push(scoreColorCompatibility(selectedItems[left].colorCategory, selectedItems[right].colorCategory))
    }
  }

  return clampScore(45 + average(pairScores) * 15)
}

function scoreSilhouetteBalance(draft: OutfitDraft, profile: PreferenceProfile) {
  if (draft.mode === 'partial') {
    return draft.bottom || draft.top ? 46 : 35
  }

  let score = draft.mode === 'onePiece' ? 78 : 74

  if (draft.mode === 'onePiece' && profile.silhouettePreference.includes('onePiece')) {
    score += 12
  }

  if (draft.mode === 'separates' && draft.top && draft.bottom) {
    score += Math.min(10, countSharedStyleTags(draft.top.styleTags, draft.bottom.styleTags) * 5)

    if (profile.silhouettePreference.includes('shortTopHighWaist') || profile.silhouettePreference.includes('fittedTopWideBottom')) {
      score += 4
    }
  }

  return clampScore(score)
}

function scoreLayering(draft: OutfitDraft, weather: TodayWeather | null, profile: PreferenceProfile) {
  const wantsOuterLayer = shouldUseOuterLayer(weather, profile)

  if (weather?.isCold) {
    return draft.outerLayer ? 94 : 42
  }

  if (weather?.isWarm) {
    return draft.outerLayer ? 64 : 90
  }

  if (wantsOuterLayer) {
    return draft.outerLayer ? 86 : 56
  }

  return draft.outerLayer ? 76 : 82
}

function scoreFocalPoint(draft: OutfitDraft, profile: PreferenceProfile) {
  if (profile.focalPointPreference === 'shoes') {
    return draft.shoes ? 90 : 48
  }

  if (profile.focalPointPreference === 'bagAccessory') {
    return draft.bag || draft.accessories.length > 0 ? 90 : 50
  }

  if (profile.focalPointPreference === 'upperBody') {
    return draft.top && isVividColor(draft.top.colorCategory) ? 88 : 68
  }

  if (profile.focalPointPreference === 'waist') {
    return draft.mode === 'separates' ? 78 : 64
  }

  const selectedItems = getSelectedItems(draft)
  const vividCount = selectedItems.filter((item) => isVividColor(item.colorCategory)).length

  return vividCount <= 1 ? 84 : 62
}

function scoreSceneFit(draft: OutfitDraft, profile: PreferenceProfile) {
  const sceneTags: Record<PreferenceProfile['preferredScenes'][number], string[]> = {
    work: ['通勤', '正式', '商务'],
    casual: ['休闲', '基础', '极简'],
    date: ['约会', '优雅', '甜美'],
    travel: ['旅行', '休闲', '轻便'],
    outdoor: ['户外', '运动', '防风'],
    party: ['派对', '亮片', '华丽']
  }
  const selectedTags = getSelectedItems(draft).flatMap((item) => item.styleTags)
  const preferredTags = profile.preferredScenes.flatMap((scene) => sceneTags[scene] ?? [])
  const matchedTags = new Set(selectedTags.filter((tag) => preferredTags.includes(tag)))

  if (matchedTags.size > 0) {
    return clampScore(76 + matchedTags.size * 6)
  }

  const coreItems = buildCoreReferenceItems(draft)
  const sharedCoreTags = coreItems.length > 1 ? countSharedStyleTags(coreItems[0].styleTags, coreItems[1].styleTags) : 0

  return clampScore(64 + sharedCoreTags * 6)
}

function scoreWeatherComfort(draft: OutfitDraft, weather: TodayWeather | null) {
  if (weather?.isCold) {
    return draft.outerLayer ? 92 : 45
  }

  if (weather?.isWarm) {
    return draft.outerLayer ? 62 : 90
  }

  return draft.shoes ? 82 : 70
}

function scoreCompleteness(draft: OutfitDraft) {
  const coreMissing = draft.missingSlots.filter((slot) => slot === 'top' || slot === 'bottom' || slot === 'dress').length
  const optionalMissing = draft.missingSlots.length - coreMissing

  return clampScore(100 - coreMissing * 28 - optionalMissing * 12)
}

function scoreFreshness(draft: OutfitDraft) {
  const selectedItems = getSelectedItems(draft)
  return clampScore(48 + average(selectedItems.map(getWearFreshnessScore)) * 4)
}

function buildComponentScores(draft: OutfitDraft, weather: TodayWeather | null, profile: PreferenceProfile): ScoreWeights {
  return {
    colorHarmony: scoreColorHarmony(draft),
    silhouetteBalance: scoreSilhouetteBalance(draft, profile),
    layering: scoreLayering(draft, weather, profile),
    focalPoint: scoreFocalPoint(draft, profile),
    sceneFit: scoreSceneFit(draft, profile),
    weatherComfort: scoreWeatherComfort(draft, weather),
    completeness: scoreCompleteness(draft),
    freshness: scoreFreshness(draft)
  }
}

function getFinalScore(componentScores: ScoreWeights, weights: ScoreWeights) {
  return Object.entries(weights).reduce((score, [key, weight]) => {
    return score + componentScores[key as keyof ScoreWeights] * weight
  }, 0)
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

  return {
    id: draft.id,
    reason: draft.mode === 'onePiece' ? buildDressReason(draft, weather) : buildPairReason(draft, weather),
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
    mode: draft.mode
  }
}

function buildRecommendationCandidates(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  preferenceState?: RecommendationPreferenceState
) {
  const profile = preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE
  const weights = preferenceState?.finalWeights ?? DEFAULT_RECOMMENDATION_WEIGHTS
  const tops = [...items.filter((item) => isTopCategory(item.category))].sort(compareWearPriority)
  const bottoms = [...items.filter((item) => isBottomCategory(item.category))].sort(compareWearPriority)
  const dresses = [...items.filter((item) => isOnePieceCategory(item.category))].sort(compareWearPriority)
  const outerLayers = [...items.filter((item) => isOuterwearCategory(item.category))].sort(compareWearPriority)
  const shoes = [...items.filter((item) => isShoesCategory(item.category))].sort(compareWearPriority)
  const bags = [...items.filter((item) => isBagCategory(item.category))].sort(compareWearPriority)
  const accessories = [...items.filter((item) => isAccessoryCategory(item.category))].sort(compareWearPriority)
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
      recommendation: toRecommendation(completedDraft, componentScores, score, weather)
    })
  }

  for (const dress of dresses) {
    finishDraft({
      id: `dress-${dress.id}`,
      mode: 'onePiece',
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
        mode: 'separates',
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
      mode: 'partial',
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
      mode: 'partial',
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

export function generateTodayRecommendations(
  params: GenerateTodayRecommendationsParams
): TodayRecommendation[]
export function generateTodayRecommendations(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  offset?: number
): TodayRecommendation[]
export function generateTodayRecommendations(
  input: ClosetItemCardData[] | GenerateTodayRecommendationsParams,
  weatherArg: TodayWeather | null = null,
  offsetArg = 0
): TodayRecommendation[] {
  const items = Array.isArray(input) ? input : input.items
  const weather = Array.isArray(input) ? weatherArg : input.weather
  const offset = Array.isArray(input) ? offsetArg : input.offset ?? 0
  const preferenceState = Array.isArray(input) ? undefined : input.preferenceState
  const recommendations = buildRecommendationBatch(buildRecommendationCandidates(items, weather, preferenceState), offset)

  while (recommendations.length < 3 && recommendations.length > 0) {
    const seed = recommendations[recommendations.length % Math.max(1, recommendations.length)]
    recommendations.push({
      ...seed,
      id: `${seed.id}-alt-${recommendations.length}`,
      reason: `${seed.reason}，适合换一套思路`
    })
  }

  return recommendations.slice(0, 3)
}
