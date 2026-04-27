import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  getColorDefinition,
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
import type { RecommendationStrategyKey } from '@/lib/recommendation/canonical-types'
import type { CandidateModelScoreMap, EntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { isGoodInspirationCandidate } from '@/lib/recommendation/exploration'
import type { RecommendationLearningSignal } from '@/lib/recommendation/learning-signals'
import { itemMatchesFormulaSlot, rankOutfitFormulas } from '@/lib/recommendation/outfit-formulas'
import {
  filterWeatherSuitableItems,
  getItemFreshnessScore,
  getItemWeatherSuitability,
  rankItemsForRecommendation
} from '@/lib/recommendation/outfit-evaluator'
import { getRecommendationStrategyDisplay } from '@/lib/recommendation/strategy-display'
import type { RecommendationTrendSignal } from '@/lib/recommendation/trends'
import type { InspirationCandidateSignals, PreferenceProfile, PreferredScene, RecommendationPreferenceState, ScoreWeights } from '@/lib/recommendation/preference-types'
import type {
  TodayRecommendation,
  TodayInspirationPolicy,
  TodayRecommendationItem,
  TodayRecommendationMissingSlot,
  TodayScene,
  TodayTargetDate,
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
  entityModelScoreMap?: EntityModelScoreMap
  trendSignals?: RecommendationTrendSignal[]
  learningSignals?: RecommendationLearningSignal[]
  targetDate?: TodayTargetDate
  scene?: TodayScene
  targetScenes?: PreferredScene[]
  inspirationPolicy?: TodayInspirationPolicy
  excludeRecommendationIds?: string[]
  baselineRecommendations?: TodayRecommendation[]
  limit?: number
}

type OutfitKind = 'separates' | 'onePiece' | 'partial'
type RecallSource = 'formula' | 'rule' | 'weather' | 'exploration' | 'model_seed'

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
  formulaId?: string | null
  recallSource?: RecallSource
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

function applyTargetScenes(profile: PreferenceProfile, targetScenes: PreferredScene[] = []) {
  if (targetScenes.length === 0) {
    return profile
  }

  return {
    ...profile,
    preferredScenes: [...targetScenes]
  }
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

function getNonNeutralFamilyMatchScore(item: ClosetItemCardData, referenceItems: ClosetItemCardData[]) {
  const itemColor = getColorDefinition(item.colorCategory)

  if (!itemColor || isNeutralColor(item.colorCategory)) {
    return 0
  }

  return referenceItems.some((reference) => getColorDefinition(reference.colorCategory)?.family === itemColor.family) ? 5 : 0
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
      const styleScore = average(referenceItems.map((reference) => countSharedStyleTags(item.styleTags, reference.styleTags))) * 4
      const sceneScore = includeScene ? getSceneMatchScore(item, profile) : 0
      const weatherScore = includeWeather ? getWeatherMatchScore(item, weather) : 0
      const familyMatchScore = getNonNeutralFamilyMatchScore(item, referenceItems)
      return colorScore + styleScore + familyMatchScore + sceneScore + weatherScore + getWearFreshnessScore(item)
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

function buildHighScoreHighlights(
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

  return parts
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

function buildReasonHighlights({
  strategyReason,
  scoreHighlights,
  missingSlotReasons
}: {
  strategyReason?: string | null
  scoreHighlights: string[]
  missingSlotReasons: string[]
}) {
  const highlights = [
    strategyReason ?? '',
    ...scoreHighlights,
    ...missingSlotReasons
  ].filter(Boolean)

  return [...new Set(highlights)].slice(0, 3)
}

function toRecommendation(
  draft: OutfitDraft,
  componentScores: ScoreWeights,
  score: number,
  weather: TodayWeather | null,
  profile: PreferenceProfile,
  weights: ScoreWeights,
  scoreBreakdown?: ReturnType<typeof scoreRecommendationCandidate>['scoreBreakdown'],
  targetDate: TodayTargetDate = 'today',
  scene: TodayScene = null
): TodayRecommendation {
  const confidence = clampScore(componentScores.completeness * 0.52 + score * 0.48)
  const strategyReason = scoreBreakdown?.explanation?.[0]?.replace(/。$/u, '')
  const scoreHighlights = buildHighScoreHighlights(draft, componentScores, weather, profile, weights)
  const coreReason = buildReason(scoreHighlights)
  const missingSlotReasons = buildMissingSlotReason(draft)

  return {
    id: draft.id,
    reason: buildReason([strategyReason ?? '', coreReason, ...missingSlotReasons]),
    reasonHighlights: buildReasonHighlights({
      strategyReason,
      scoreHighlights,
      missingSlotReasons
    }),
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
    primaryStrategy: scoreBreakdown?.primaryStrategy ?? null,
    modelScores: scoreBreakdown?.modelScores,
    modelRunId: scoreBreakdown?.modelScores.modelRunId ?? null,
    formulaId: draft.formulaId ?? null,
    recallSource: draft.recallSource ?? 'rule',
    targetDate,
    scene,
    mode: 'daily',
    inspirationReason: null,
    dailyDifference: null
  }
}

function getEntityModelSeedScore(item: ClosetItemCardData, entityModelScoreMap: EntityModelScoreMap) {
  const score = entityModelScoreMap[item.id]
  return score?.finalScore ?? Math.max(score?.lightfmScore ?? 0, score?.implicitScore ?? 0)
}

function rankModelSeedItems(items: ClosetItemCardData[], entityModelScoreMap: EntityModelScoreMap) {
  return [...items]
    .map((item) => ({ item, score: getEntityModelSeedScore(item, entityModelScoreMap) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return compareWearPriority(left.item, right.item)
    })
    .map(({ item }) => item)
}

function buildRecommendationCandidates(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  preferenceState?: RecommendationPreferenceState,
  modelScoreMap: CandidateModelScoreMap = {},
  entityModelScoreMap: EntityModelScoreMap = {},
  trendSignals: RecommendationTrendSignal[] = [],
  learningSignals: RecommendationLearningSignal[] = [],
  targetDate: TodayTargetDate = 'today',
  scene: TodayScene = null,
  targetScenes: PreferredScene[] = []
) {
  const profile = applyTargetScenes(preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE, targetScenes)
  const weights = preferenceState?.finalWeights ?? DEFAULT_RECOMMENDATION_WEIGHTS
  const rankContext = { weather, profile, scenes: targetScenes.length > 0 ? targetScenes : undefined }
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
  const seenDraftIds = new Set<string>()

  const pushCompletedDraft = (completedDraft: OutfitDraft) => {
    if (seenDraftIds.has(completedDraft.id)) {
      return
    }

    seenDraftIds.add(completedDraft.id)
    const completedDraftModelScore = modelScoreMap[completedDraft.id]
    const scoredCandidate = scoreRecommendationCandidate({
      id: completedDraft.id,
      surface: 'today',
      outfit: completedDraft,
      context: {
        weather,
        profile,
        scenes: targetScenes.length > 0 ? targetScenes : undefined,
        trendSignals,
        learningSignals,
        formulaId: completedDraft.formulaId ?? null,
        recallSource: completedDraft.recallSource ?? 'rule',
        effortLevel: profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority ? 'low' : 'medium'
      }
    }, completedDraftModelScore)
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
      recommendation: toRecommendation(completedDraft, componentScores, score, weather, profile, weights, scoreBreakdown, targetDate, scene)
    })
  }

  const finishDraft = (draft: OutfitDraft) => {
    if (seenDraftIds.has(draft.id)) {
      return
    }

    const completedDraft = addCompletionSlots({
      draft,
      outerLayers,
      shoes,
      bags,
      accessories,
      weather,
      profile
    })

    pushCompletedDraft(completedDraft)

    const referenceItems = [...buildCoreReferenceItems(completedDraft), completedDraft.outerLayer].filter((item): item is ClosetItemCardData => item !== null)
    const alternateBag = completedDraft.bag
      ? pickBestMatchingItem({
          referenceItems,
          candidates: bags.filter((bag) => bag.id !== completedDraft.bag?.id),
          profile,
          weather,
          includeScene: true
        })
      : null
    const alternateShoes = completedDraft.shoes
      ? pickBestMatchingItem({
          referenceItems,
          candidates: shoes.filter((shoe) => shoe.id !== completedDraft.shoes?.id),
          profile,
          weather,
          includeScene: true,
          includeWeather: true
        })
      : null

    if (alternateBag) {
      pushCompletedDraft({
        ...completedDraft,
        id: `${completedDraft.id}-bag-${alternateBag.id}`,
        bag: alternateBag,
        accessories: [...completedDraft.accessories]
      })
    }

    if (alternateShoes) {
      pushCompletedDraft({
        ...completedDraft,
        id: `${completedDraft.id}-shoes-${alternateShoes.id}`,
        shoes: alternateShoes,
        accessories: [...completedDraft.accessories]
      })
    }
  }

  const formulaCandidates = rankOutfitFormulas({ profile, weather }).slice(0, 5)

  for (const formula of formulaCandidates) {
    if (formula.requiredSlots.includes('dress')) {
      dresses
        .filter((dress) => itemMatchesFormulaSlot(dress, formula, 'dress'))
        .slice(0, 4)
        .forEach((dress) => finishDraft({
          id: `formula-${formula.id}-${dress.id}`,
          outfitKind: 'onePiece',
          top: null,
          bottom: null,
          dress,
          outerLayer: null,
          shoes: null,
          bag: null,
          accessories: [],
          missingSlots: [],
          mainIds: [dress.id],
          formulaId: formula.id,
          recallSource: 'formula'
        }))

      continue
    }

    const formulaTops = tops.filter((top) => itemMatchesFormulaSlot(top, formula, 'top')).slice(0, 4)
    const formulaBottoms = bottoms.filter((bottom) => itemMatchesFormulaSlot(bottom, formula, 'bottom')).slice(0, 4)

    for (const top of formulaTops) {
      for (const bottom of formulaBottoms) {
        finishDraft({
          id: `formula-${formula.id}-${top.id}-${bottom.id}`,
          outfitKind: 'separates',
          top,
          bottom,
          dress: null,
          outerLayer: null,
          shoes: null,
          bag: null,
          accessories: [],
          missingSlots: [],
          mainIds: [top.id, bottom.id],
          formulaId: formula.id,
          recallSource: 'formula'
        })
      }
    }
  }

  const modelSeeds = rankModelSeedItems(items, entityModelScoreMap).slice(0, 12)

  for (const seed of modelSeeds) {
    if (isOnePieceCategory(seed.category)) {
      finishDraft({
        id: `model-seed-${seed.id}`,
        outfitKind: 'onePiece',
        top: null,
        bottom: null,
        dress: seed,
        outerLayer: null,
        shoes: null,
        bag: null,
        accessories: [],
        missingSlots: [],
        mainIds: [seed.id],
        recallSource: 'model_seed'
      })
      continue
    }

    if (isTopCategory(seed.category)) {
      const bottom = pickBestMatchingItem({
        referenceItems: [seed],
        candidates: bottoms,
        profile,
        weather,
        includeScene: true,
        includeWeather: true
      })

      finishDraft({
        id: `model-seed-${seed.id}-${bottom?.id ?? 'missing-bottom'}`,
        outfitKind: bottom ? 'separates' : 'partial',
        top: seed,
        bottom,
        dress: null,
        outerLayer: null,
        shoes: null,
        bag: null,
        accessories: [],
        missingSlots: bottom ? [] : ['bottom'],
        mainIds: bottom ? [seed.id, bottom.id] : [seed.id],
        recallSource: 'model_seed'
      })
      continue
    }

    if (isBottomCategory(seed.category)) {
      const top = pickBestMatchingItem({
        referenceItems: [seed],
        candidates: tops,
        profile,
        weather,
        includeScene: true,
        includeWeather: true
      })

      finishDraft({
        id: `model-seed-${top?.id ?? 'missing-top'}-${seed.id}`,
        outfitKind: top ? 'separates' : 'partial',
        top,
        bottom: seed,
        dress: null,
        outerLayer: null,
        shoes: null,
        bag: null,
        accessories: [],
        missingSlots: top ? [] : ['top'],
        mainIds: top ? [top.id, seed.id] : [seed.id],
        recallSource: 'model_seed'
      })
    }
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
      mainIds: [dress.id],
      recallSource: weather ? 'weather' : 'rule'
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
        mainIds: [top.id, bottom.id],
        recallSource: weather ? 'weather' : 'rule'
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
      mainIds: [top.id],
      recallSource: 'rule'
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
      mainIds: [bottom.id],
      recallSource: 'rule'
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
  const dailyDifference = buildInspirationDifference(candidate, profile, baselineRecommendations)
  const baseHighlights = candidate.recommendation.reasonHighlights ?? [candidate.recommendation.reason]

  return {
    ...candidate.recommendation,
    id: `inspiration-${candidate.recommendation.id}`,
    reason: `灵感套装：${candidate.recommendation.reason}`,
    reasonHighlights: [
      `灵感套装：${baseHighlights[0] ?? candidate.recommendation.reason}`,
      ...baseHighlights.slice(1, 2),
      dailyDifference
    ].filter(Boolean).slice(0, 3),
    mode: 'inspiration',
    recallSource: 'exploration',
    inspirationReason: '灵感套装',
    dailyDifference
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

function getRecommendationFinishers(recommendation: TodayRecommendation) {
  return [
    recommendation.shoes,
    recommendation.bag,
    ...(recommendation.accessories ?? [])
  ].filter((item): item is TodayRecommendationItem => Boolean(item))
}

function getRecommendationPrimaryStrategy(recommendation: TodayRecommendation) {
  return recommendation.primaryStrategy ?? recommendation.scoreBreakdown?.primaryStrategy ?? null
}

function getStrategyName(strategy: RecommendationStrategyKey | null | undefined) {
  return strategy ? getRecommendationStrategyDisplay(strategy).name : ''
}

function getRecommendationOutfitKind(recommendation: TodayRecommendation) {
  if (recommendation.dress) {
    return 'onePiece'
  }

  if (recommendation.top && recommendation.bottom) {
    return 'separates'
  }

  return 'partial'
}

function describeRecommendationCore(recommendation: TodayRecommendation) {
  if (recommendation.dress) {
    return recommendation.dress.subCategory ?? recommendation.dress.category
  }

  if (recommendation.top && recommendation.bottom) {
    return `${recommendation.top.subCategory ?? recommendation.top.category}配${recommendation.bottom.subCategory ?? recommendation.bottom.category}`
  }

  return recommendation.top?.subCategory ?? recommendation.bottom?.subCategory ?? recommendation.top?.category ?? recommendation.bottom?.category ?? '主组合'
}

function getRecommendationColors(recommendation: TodayRecommendation) {
  return [...new Set(getRecommendationItems(recommendation).map((item) => item.colorCategory).filter((color): color is string => Boolean(color)))]
}

function buildBatchDifferenceHighlight(current: TodayRecommendation, previous: TodayRecommendation) {
  const currentPrimary = getRecommendationPrimaryStrategy(current)
  const previousPrimary = getRecommendationPrimaryStrategy(previous)

  if (currentPrimary && previousPrimary && currentPrimary !== previousPrimary) {
    return `和上一套拉开差异：这套主打${getStrategyName(currentPrimary)}，上一套主打${getStrategyName(previousPrimary)}，决策理由不是重复同一套安全模板`
  }

  const currentKind = getRecommendationOutfitKind(current)
  const previousKind = getRecommendationOutfitKind(previous)

  if (currentKind !== previousKind) {
    return `和上一套拉开差异：主轮廓换成${currentKind === 'onePiece' ? '一件式' : currentKind === 'separates' ? '上下装' : '单品起步'}，不是只替换颜色`
  }

  const previousColors = new Set(getRecommendationColors(previous))
  const newColors = getRecommendationColors(current).filter((color) => !previousColors.has(color))

  if (newColors.length > 0) {
    return `和上一套拉开差异：新增${newColors.slice(0, 3).join(' / ')}，颜色组合有变化但仍保持低冲突`
  }

  const previousFinisherIds = new Set(getRecommendationFinishers(previous).map((item) => item.id))
  const newFinishers = getRecommendationFinishers(current).filter((item) => !previousFinisherIds.has(item.id))

  if (newFinishers.length > 0) {
    return `和上一套拉开差异：鞋包配饰换成${newFinishers.map((item) => item.subCategory ?? item.category).slice(0, 2).join(' / ')}，收尾方式不同`
  }

  return `和上一套拉开差异：主组合换成${describeRecommendationCore(current)}，不是复用同一组核心单品`
}

function withBatchDifferenceHighlights(recommendations: TodayRecommendation[]) {
  return recommendations.map((recommendation, index) => {
    const previous = recommendations[index - 1]

    if (!previous) {
      return recommendation
    }

    const difference = buildBatchDifferenceHighlight(recommendation, previous)
    const existingHighlights = (recommendation.reasonHighlights ?? [recommendation.reason]).filter(Boolean)
    const firstHighlight = existingHighlights[0] ?? recommendation.reason
    const reasonHighlights = [
      firstHighlight,
      difference,
      ...existingHighlights.slice(1)
    ].filter((highlight, highlightIndex, highlights) => highlights.indexOf(highlight) === highlightIndex).slice(0, 3)
    const reason = recommendation.reason.includes(difference)
      ? recommendation.reason
      : buildReason([recommendation.reason, difference])

    return {
      ...recommendation,
      reason,
      reasonHighlights
    }
  })
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

function recommendationMatchesExcludedId(recommendationId: string, excludedIds: Set<string>) {
  return excludedIds.has(recommendationId) || excludedIds.has(`inspiration-${recommendationId}`)
}

function buildRecommendationBatch(candidates: RecommendationCandidate[], offset: number) {
  if (candidates.length === 0) {
    return []
  }

  const windowStart = (Math.max(0, offset) * 3) % candidates.length
  const rotatedCandidates = [...candidates.slice(windowStart), ...candidates.slice(0, windowStart)]
  const selected: TodayRecommendation[] = []
  const selectedCandidateIds = new Set<string>()
  const usedMainIds = new Set<string>()
  const rotatedOrder = new Map(rotatedCandidates.map((candidate, index) => [candidate.recommendation.id, index]))

  function getBatchSelectionScore(candidate: RecommendationCandidate) {
    const orderBias = Math.max(0, 30 - (rotatedOrder.get(candidate.recommendation.id) ?? 0) * 3)

    if (selected.length === 0) {
      return candidate.score + orderBias
    }

    const selectedPrimaryStrategies = new Set(selected.map(getRecommendationPrimaryStrategy).filter(Boolean))
    const selectedRecallSources = new Set(selected.map((recommendation) => recommendation.recallSource).filter(Boolean))
    const selectedOutfitKinds = new Set(selected.map(getRecommendationOutfitKind))
    const selectedFinisherIds = new Set(selected.flatMap(getRecommendationFinishers).map((item) => item.id))
    const candidateFinishers = [
      candidate.draft.shoes,
      candidate.draft.bag,
      ...candidate.draft.accessories
    ].filter((item): item is ClosetItemCardData => Boolean(item))
    const repeatedFinisherCount = candidateFinishers.filter((item) => selectedFinisherIds.has(item.id)).length
    const primaryStrategy = getRecommendationPrimaryStrategy(candidate.recommendation)
    const recallSource = candidate.recommendation.recallSource
    const diversityScore = getDiversityScore(candidate, selected)

    return (
      candidate.score +
      orderBias * 0.2 +
      diversityScore * 0.38 +
      (primaryStrategy ? !selectedPrimaryStrategies.has(primaryStrategy) ? 14 : -10 : 0) +
      (recallSource && !selectedRecallSources.has(recallSource) ? 6 : 0) +
      (!selectedOutfitKinds.has(candidate.draft.outfitKind) ? 8 : 0) -
      repeatedFinisherCount * 18
    )
  }

  while (selected.length < 3 && selectedCandidateIds.size < rotatedCandidates.length) {
    const remainingCandidates = rotatedCandidates.filter((candidate) => !selectedCandidateIds.has(candidate.recommendation.id))
    const nonConflictingCandidates = remainingCandidates.filter((candidate) => candidate.mainIds.every((id) => !usedMainIds.has(id)))
    const candidatePool = nonConflictingCandidates.length > 0 ? nonConflictingCandidates : remainingCandidates
    const nextCandidate = candidatePool
      .map((candidate) => ({
        candidate,
        selectionScore: getBatchSelectionScore(candidate)
      }))
      .sort((left, right) => {
        if (right.selectionScore !== left.selectionScore) {
          return right.selectionScore - left.selectionScore
        }

        return (rotatedOrder.get(left.candidate.recommendation.id) ?? 0) - (rotatedOrder.get(right.candidate.recommendation.id) ?? 0)
      })[0]?.candidate ?? null

    if (!nextCandidate) {
      break
    }

    selected.push(nextCandidate.recommendation)
    selectedCandidateIds.add(nextCandidate.recommendation.id)
    nextCandidate.mainIds.forEach((id) => usedMainIds.add(id))
  }

  return selected
}

function maybeInsertInspirationRecommendation({
  recommendations,
  candidates,
  preferenceState,
  weather,
  targetScenes = [],
  inspirationPolicy = 'auto'
}: {
  recommendations: TodayRecommendation[]
  candidates: RecommendationCandidate[]
  preferenceState?: RecommendationPreferenceState
  weather: TodayWeather | null
  targetScenes?: PreferredScene[]
  inspirationPolicy?: TodayInspirationPolicy
}) {
  const profile = applyTargetScenes(preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE, targetScenes)

  if (inspirationPolicy === 'suppress' || !profile.exploration.enabled || profile.exploration.rate <= 0 || recommendations.length < 3) {
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

function buildForcedInspirationRecommendation({
  candidates,
  preferenceState,
  weather,
  targetScenes = [],
  baselineRecommendations = []
}: {
  candidates: RecommendationCandidate[]
  preferenceState?: RecommendationPreferenceState
  weather: TodayWeather | null
  targetScenes?: PreferredScene[]
  baselineRecommendations?: TodayRecommendation[]
}) {
  const profile = applyTargetScenes(preferenceState?.profile ?? DEFAULT_PREFERENCE_PROFILE, targetScenes)

  if (!profile.exploration.enabled || profile.exploration.rate <= 0) {
    return null
  }

  const selectedCandidate = pickInspirationCandidate({
    candidates,
    dailyRecommendations: baselineRecommendations.slice(-2),
    profile,
    weather
  })

  return selectedCandidate ? toInspirationRecommendation(selectedCandidate, profile, baselineRecommendations.slice(-2)) : null
}

export function generateTodayRecommendations(
  params: GenerateTodayRecommendationsParams
): TodayRecommendation[] {
  const {
    items,
    weather,
    preferenceState,
    modelScoreMap = {},
    entityModelScoreMap = {},
    trendSignals = [],
    learningSignals = []
  } = params
  const offset = params.offset ?? 0
  const limit = Math.max(1, params.limit ?? 3)
  const inspirationPolicy = params.inspirationPolicy ?? 'auto'
  const targetDate = params.targetDate ?? weather?.targetDate ?? 'today'
  const scene = params.scene ?? null
  const targetScenes = params.targetScenes ?? (scene ? [scene] : [])
  const excludedIds = new Set(params.excludeRecommendationIds ?? [])
  const candidates = buildRecommendationCandidates(
    items,
    weather,
    preferenceState,
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    targetDate,
    scene,
    targetScenes
  ).filter((candidate) => !recommendationMatchesExcludedId(candidate.recommendation.id, excludedIds))

  if (inspirationPolicy === 'force') {
    const inspirationRecommendation = buildForcedInspirationRecommendation({
      candidates,
      preferenceState,
      weather,
      targetScenes,
      baselineRecommendations: params.baselineRecommendations ?? []
    })

    if (inspirationRecommendation) {
      return withBatchDifferenceHighlights([inspirationRecommendation]).slice(0, limit)
    }
  }

  const recommendations = buildRecommendationBatch(candidates, offset)

  while (recommendations.length < 3 && recommendations.length > 0) {
    const seed = recommendations[recommendations.length % Math.max(1, recommendations.length)]
    recommendations.push({
      ...seed,
      id: `${seed.id}-alt-${recommendations.length}`,
      reason: `${seed.reason}，适合换一套思路`
    })
  }

  const finalRecommendations = maybeInsertInspirationRecommendation({
    recommendations,
    candidates,
    preferenceState,
    weather,
    targetScenes,
    inspirationPolicy
  }).slice(0, limit)

  return withBatchDifferenceHighlights(finalRecommendations)
}
