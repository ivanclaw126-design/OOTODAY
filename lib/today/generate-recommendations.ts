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
import { buildMissingSlotCopy, buildRecommendationColorNotes } from '@/lib/recommendation/copy'
import { getLegacyWeightedRuleScore, scoreRecommendationCandidate } from '@/lib/recommendation/canonical-scoring'
import type { CandidateModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { isGoodInspirationCandidate } from '@/lib/recommendation/exploration'
import {
  filterWeatherSuitableItems,
  getItemFreshnessScore,
  getItemWeatherSuitability,
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
  modelScoreMap?: CandidateModelScoreMap
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

type ScoreHighlightKey = keyof ScoreWeights

const SCORE_HIGHLIGHT_KEYS: ScoreHighlightKey[] = [
  'completeness',
  'weatherComfort',
  'colorHarmony',
  'sceneFit',
  'silhouetteBalance',
  'layering',
  'focalPoint',
  'freshness'
]

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

function describeItem(item: ClosetItemCardData | null | undefined) {
  return item ? item.subCategory ?? item.category : ''
}

function getUniqueColors(draft: OutfitDraft) {
  return [...new Set(getSelectedItems(draft).map((item) => item.colorCategory).filter((color): color is string => Boolean(color)))]
}

function getSharedStyleTag(draft: OutfitDraft) {
  const items = getSelectedItems(draft)
  const tags = items.flatMap((item) => item.styleTags)

  return tags.find((tag, index) => tags.indexOf(tag) !== index) ?? tags[0] ?? null
}

function getFocusItem(draft: OutfitDraft) {
  const selectedItems = getSelectedItems(draft)

  return selectedItems.find((item) => isVividColor(item.colorCategory)) ??
    selectedItems.find((item) => item.algorithmMeta?.visualWeight !== undefined && item.algorithmMeta.visualWeight >= 4) ??
    draft.outerLayer ??
    draft.bag ??
    draft.shoes ??
    selectedItems[0] ??
    null
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

function buildScoreHighlight(
  key: ScoreHighlightKey,
  draft: OutfitDraft,
  componentScores: ScoreWeights,
  weather: TodayWeather | null,
  profile: PreferenceProfile
) {
  const score = componentScores[key]
  const scoreText = Math.round(score)
  const colorText = getUniqueColors(draft).slice(0, 4).join(' / ')
  const sharedTag = getSharedStyleTag(draft)

  if (key === 'completeness') {
    if (score >= 90) {
      const finishers = [draft.outerLayer ? '外层' : null, draft.shoes ? '鞋履' : null, draft.bag ? '包袋' : null]
        .filter(Boolean)
        .join('、')

      return `完整度 ${scoreText}：${finishers || '核心单品'}已补齐，出门不用再补关键 slot`
    }

    return `完整度 ${scoreText}：核心组合能成立，但${draft.missingSlots.map((slot) => slot === 'outerLayer' ? '外层' : slot === 'shoes' ? '鞋履' : slot === 'bag' ? '包袋' : '单品').join('、')}还可继续补齐`
  }

  if (key === 'weatherComfort') {
    if (!weather) {
      return `舒适度 ${scoreText}：单品厚薄和鞋履都在日常安全区`
    }

    if (weather.isCold) {
      return draft.outerLayer
        ? `天气舒适 ${scoreText}：${describeItem(draft.outerLayer)}负责保暖，冷天不会只靠内搭硬撑`
        : `天气舒适 ${scoreText}：核心单品可先成立，但冷天外层仍是短板`
    }

    if (isMildCoolWeather(weather)) {
      return draft.outerLayer
        ? `天气舒适 ${scoreText}：${weather.temperatureC}度微凉，${describeItem(draft.outerLayer)}负责控温`
        : `天气舒适 ${scoreText}：${weather.temperatureC}度微凉，核心单品偏轻，建议补外层`
    }

    if (weather.isWarm) {
      return `天气舒适 ${scoreText}：偏暖天气里主件轻量，没有额外堆厚重外层`
    }

    return `天气舒适 ${scoreText}：温度温和，单品厚薄不用做极端取舍`
  }

  if (key === 'colorHarmony') {
    const colorNotes = buildTodayColorNotes(getSelectedItems(draft).map((item) => item.colorCategory))
    const colorPoint = colorNotes[0] ? colorNotes[0].replace(/^基础色托底，?/u, '') : '颜色冲突低'

    return `配色 ${scoreText}：${colorText || '现有颜色'}，${colorPoint}`
  }

  if (key === 'sceneFit') {
    const sceneLabel = profile.preferredScenes.includes('work')
      ? '通勤'
      : profile.preferredScenes.includes('date')
        ? '约会'
        : profile.preferredScenes.includes('travel')
          ? '出行'
          : '日常'

    return `场景 ${scoreText}：${sharedTag ? `风格线索集中在${sharedTag}` : '单品风格不互相打架'}，适合${sceneLabel}使用`
  }

  if (key === 'silhouetteBalance') {
    if (draft.dress) {
      return `比例 ${scoreText}：${describeItem(draft.dress)}一件成型，轮廓不会被上下装切碎`
    }

    if (draft.top && draft.bottom) {
      return `比例 ${scoreText}：${describeItem(draft.top)}配${describeItem(draft.bottom)}，上装和下装体量相对平衡`
    }

    return `比例 ${scoreText}：先保住已有主件轮廓，再补缺失单品`
  }

  if (key === 'layering') {
    if (draft.outerLayer) {
      return `层次 ${scoreText}：${describeItem(draft.outerLayer)}只加一层，温差和轮廓都更清楚`
    }

    return `层次 ${scoreText}：不强行叠穿，保留更轻的日常轮廓`
  }

  if (key === 'focalPoint') {
    const focusItem = getFocusItem(draft)

    return focusItem
      ? `视觉重点 ${scoreText}：重点落在${describeItem(focusItem)}，没有同时堆多个抢眼单品`
      : `视觉重点 ${scoreText}：整体收得干净，没有多焦点竞争`
  }

  const freshItem = getSelectedItems(draft).find((item) => !item.lastWornDate) ?? getSelectedItems(draft).sort(compareWearPriority)[0]

  return freshItem
    ? `新鲜度 ${scoreText}：优先调用${describeItem(freshItem)}，减少连续穿同一件的疲劳`
    : `新鲜度 ${scoreText}：穿着频率仍在可接受范围`
}

function buildHighScoreReason(
  draft: OutfitDraft,
  componentScores: ScoreWeights,
  weather: TodayWeather | null,
  profile: PreferenceProfile,
  weights: ScoreWeights
) {
  const parts: string[] = []

  if (draft.outfitKind === 'partial') {
    parts.push(weather?.isCold ? '先用已有单品起一套思路，冷天后续优先补外层' : '先用已有单品起一套思路')
  }

  const rankedKeys = SCORE_HIGHLIGHT_KEYS
    .filter((key) => componentScores[key] >= 68)
    .sort((left, right) => {
      const leftImpact = componentScores[left] * weights[left]
      const rightImpact = componentScores[right] * weights[right]

      if (rightImpact !== leftImpact) {
        return rightImpact - leftImpact
      }

      return componentScores[right] - componentScores[left]
    })

  for (const key of rankedKeys) {
    const highlight = buildScoreHighlight(key, draft, componentScores, weather, profile)
    const dimension = highlight.split(' ')[0]

    if (!parts.some((part) => part.startsWith(dimension))) {
      parts.push(highlight)
    }

    if (parts.length >= 4) {
      break
    }
  }

  if (parts.length === 0) {
    parts.push('这套分数集中在基础可穿性，适合先作为日常安全组合')
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

function toRecommendation(
  draft: OutfitDraft,
  componentScores: ScoreWeights,
  score: number,
  weather: TodayWeather | null,
  profile: PreferenceProfile,
  weights: ScoreWeights,
  scoreBreakdown?: ReturnType<typeof scoreRecommendationCandidate>['scoreBreakdown']
): TodayRecommendation {
  const confidence = clampScore(componentScores.completeness * 0.52 + score * 0.48)
  const strategyReason = scoreBreakdown?.explanation?.[0]?.replace(/。$/u, '')
  const coreReason = buildHighScoreReason(draft, componentScores, weather, profile, weights)

  return {
    id: draft.id,
    reason: buildReason([strategyReason ?? '', coreReason, ...buildMissingSlotReason(draft)]),
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
    totalScore: scoreBreakdown?.totalScore ?? score,
    scoreBreakdown,
    modelScores: scoreBreakdown?.modelScores,
    modelRunId: scoreBreakdown?.modelScores.modelRunId ?? null,
    mode: 'daily',
    inspirationReason: null,
    dailyDifference: null
  }
}

function buildRecommendationCandidates(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  preferenceState?: RecommendationPreferenceState,
  modelScoreMap: CandidateModelScoreMap = {}
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
    const scoredCandidate = scoreRecommendationCandidate({
      id: completedDraft.id,
      surface: 'today',
      outfit: completedDraft,
      context: {
        weather,
        profile,
        effortLevel: profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority ? 'low' : 'medium'
      }
    }, modelScoreMap[completedDraft.id])
    const componentScores = scoredCandidate.scoreBreakdown.componentScores
    const preferenceWeightedScore = getLegacyWeightedRuleScore(componentScores, weights)
    const score = scoredCandidate.scoreBreakdown.modelScores.status === 'active'
      ? scoredCandidate.scoreBreakdown.totalScore
      : clampScore(scoredCandidate.scoreBreakdown.totalScore * 0.45 + preferenceWeightedScore * 0.55)
    const scoreBreakdown = scoredCandidate.scoreBreakdown.modelScores.status === 'active'
      ? scoredCandidate.scoreBreakdown
      : {
          ...scoredCandidate.scoreBreakdown,
          totalScore: score
        }

    candidates.push({
      score,
      mainIds: completedDraft.mainIds,
      draft: completedDraft,
      recommendation: toRecommendation(completedDraft, componentScores, score, weather, profile, weights, scoreBreakdown)
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

function buildInspirationDifference(candidate: RecommendationCandidate, profile: PreferenceProfile, baselineRecommendations: TodayRecommendation[] = []) {
  const selectedItems = getSelectedItems(candidate.draft)
  const vividItem = selectedItems.find((item) => isVividColor(item.colorCategory))
  const baselineColors = new Set(
    baselineRecommendations
      .flatMap((recommendation) => [
        recommendation.dress,
        recommendation.top,
        recommendation.bottom,
        recommendation.outerLayer,
        recommendation.shoes,
        recommendation.bag,
        ...(recommendation.accessories ?? [])
      ])
      .filter((item): item is TodayRecommendationItem => Boolean(item))
      .map((item) => item.colorCategory)
      .filter(Boolean)
  )
  const candidateColors = getUniqueColors(candidate.draft)
  const hasNewColor = candidateColors.some((color) => !baselineColors.has(color))

  if (candidate.draft.outfitKind === 'onePiece') {
    return '比前两套多一个一件式选择，给当天更省决策的轮廓变化，但仍守住配色和天气底线。'
  }

  if (vividItem) {
    return `比前两套多一处${vividItem.colorCategory}重点，视觉变化更明确，但重点仍控制在单件上。`
  }

  if (hasNewColor && candidateColors.length > 0) {
    return `换到${candidateColors.slice(0, 3).join(' / ')}这组颜色，和前两套拉开差异，但仍保持低冲突。`
  }

  if (candidate.draft.outerLayer) {
    return `用${describeItem(candidate.draft.outerLayer)}改变外层气质，提供另一种层次选择，但不牺牲天气舒适度。`
  }

  if (profile.focalPointPreference === 'subtle') {
    return '这套比前两套换了主组合，但重点仍然收得干净，适合作为低风险灵感套装。'
  }

  return '比前两套多一点变化，但没有越过避雷、天气、场景和配色底线。'
}

function toInspirationRecommendation(candidate: RecommendationCandidate, profile: PreferenceProfile, baselineRecommendations: TodayRecommendation[] = []): TodayRecommendation {
  return {
    ...candidate.recommendation,
    id: `inspiration-${candidate.recommendation.id}`,
    reason: `灵感套装：${candidate.recommendation.reason}`,
    mode: 'inspiration',
    inspirationReason: '灵感套装',
    dailyDifference: buildInspirationDifference(candidate, profile, baselineRecommendations)
  }
}

function getRecommendationItems(recommendation: TodayRecommendation) {
  return [
    recommendation.dress,
    recommendation.top,
    recommendation.bottom,
    recommendation.outerLayer,
    recommendation.shoes,
    recommendation.bag,
    ...(recommendation.accessories ?? [])
  ].filter((item): item is TodayRecommendationItem => Boolean(item))
}

function getDiversityScore(candidate: RecommendationCandidate, baselineRecommendations: TodayRecommendation[]) {
  const baselineIds = new Set(baselineRecommendations.flatMap(getRecommendationItems).map((item) => item.id))
  const baselineColors = new Set(baselineRecommendations.flatMap(getRecommendationItems).map((item) => item.colorCategory).filter(Boolean))
  const candidateItems = getSelectedItems(candidate.draft)
  const candidateColors = getUniqueColors(candidate.draft)
  const newMainIds = candidate.mainIds.filter((id) => !baselineIds.has(id)).length
  const newColorCount = candidateColors.filter((color) => !baselineColors.has(color)).length
  const outfitKindBonus = baselineRecommendations.some((recommendation) => Boolean(recommendation.dress)) === Boolean(candidate.draft.dress) ? 0 : 12
  const outerBonus = candidate.draft.outerLayer && !baselineRecommendations.some((recommendation) => recommendation.outerLayer?.id === candidate.draft.outerLayer?.id) ? 8 : 0

  return newMainIds * 16 + newColorCount * 8 + outfitKindBonus + outerBonus + Math.min(8, candidateItems.length)
}

function isSafeInspirationCandidate(candidate: RecommendationCandidate, profile: PreferenceProfile, weather: TodayWeather | null) {
  const scores = candidate.recommendation.componentScores
  const signal = toInspirationSignal(candidate, profile, weather)

  return (
    scores.colorHarmony >= 62 &&
    scores.weatherComfort >= 62 &&
    scores.sceneFit >= 56 &&
    scores.completeness >= 70 &&
    isGoodInspirationCandidate(signal, profile)
  )
}

function pickInspirationCandidate({
  candidates,
  dailyRecommendations,
  profile,
  weather
}: {
  candidates: RecommendationCandidate[]
  dailyRecommendations: TodayRecommendation[]
  profile: PreferenceProfile
  weather: TodayWeather | null
}) {
  const dailyIds = new Set(dailyRecommendations.map((recommendation) => recommendation.id))
  const dailyMainIds = new Set(dailyRecommendations.flatMap(getRecommendationItems).map((item) => item.id))
  const safeCandidates = candidates
    .filter((candidate) => !dailyIds.has(candidate.recommendation.id))
    .filter((candidate) => isSafeInspirationCandidate(candidate, profile, weather))
  const nonOverlappingCandidates = safeCandidates.filter((candidate) => candidate.mainIds.every((id) => !dailyMainIds.has(id)))
  const candidatePool = nonOverlappingCandidates.length > 0 ? nonOverlappingCandidates : safeCandidates

  return candidatePool
    .map((candidate) => ({
      candidate,
      selectionScore: candidate.score * 0.45 + getDiversityScore(candidate, dailyRecommendations)
    }))
    .sort((left, right) => {
      if (right.selectionScore !== left.selectionScore) {
        return right.selectionScore - left.selectionScore
      }

      return left.candidate.recommendation.id.localeCompare(right.candidate.recommendation.id)
    })[0]?.candidate ?? null
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
  weather
}: {
  recommendations: TodayRecommendation[]
  candidates: RecommendationCandidate[]
  preferenceState?: RecommendationPreferenceState
  weather: TodayWeather | null
}) {
  const profile = preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE

  if (!profile.exploration.enabled || profile.exploration.rate <= 0 || recommendations.length < 3) {
    return recommendations
  }

  if (recommendations.some((recommendation) => recommendation.mode === 'inspiration')) {
    return recommendations
  }

  const dailyRecommendations = recommendations.filter((recommendation) => recommendation.mode !== 'inspiration')
  const fixedDailyRecommendations = dailyRecommendations.slice(0, 2)
  const selectedCandidate = pickInspirationCandidate({
    candidates,
    dailyRecommendations: fixedDailyRecommendations,
    profile,
    weather
  })

  if (!selectedCandidate) {
    return recommendations
  }

  const inspirationRecommendation = toInspirationRecommendation(selectedCandidate, profile, fixedDailyRecommendations)

  return [...fixedDailyRecommendations, inspirationRecommendation].slice(0, 3)
}

export function generateTodayRecommendations(
  params: GenerateTodayRecommendationsParams
): TodayRecommendation[] {
  const { items, weather, preferenceState, modelScoreMap = {} } = params
  const offset = params.offset ?? 0
  const candidates = buildRecommendationCandidates(items, weather, preferenceState, modelScoreMap)
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
    weather
  }).slice(0, 3)
}
