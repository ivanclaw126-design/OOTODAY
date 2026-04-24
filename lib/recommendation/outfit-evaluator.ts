import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  getColorDefinition,
  getOutfitColorRole,
  isAccessoryCategory,
  isBagCategory,
  isBottomCategory,
  isOnePieceCategory,
  isOuterwearCategory,
  isShoesCategory,
  isTopCategory,
  normalizeInput,
  scoreColorCompatibility,
  UNKNOWN_COLOR
} from '@/lib/closet/taxonomy'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import type { PreferredScene, PreferenceProfile, ScoreWeights } from '@/lib/recommendation/preference-types'
import type { TodayRecommendationMissingSlot, TodayWeather } from '@/lib/today/types'

export type EvaluatedOutfit = {
  top?: ClosetItemCardData | null
  bottom?: ClosetItemCardData | null
  dress?: ClosetItemCardData | null
  outerLayer?: ClosetItemCardData | null
  shoes?: ClosetItemCardData | null
  bag?: ClosetItemCardData | null
  accessories?: ClosetItemCardData[]
  missingSlots?: TodayRecommendationMissingSlot[]
}

export type OutfitEvaluationContext = {
  weather?: TodayWeather | null
  profile?: PreferenceProfile | null
  scenes?: PreferredScene[]
  travelScenes?: string[]
}

type SeasonMode = 'hot' | 'mildCool' | 'cold' | 'neutral'

const SCENE_TOKENS: Record<PreferredScene, string[]> = {
  work: ['通勤', '正式', '商务', '西装', '衬衫', '西裤', '乐福', '皮鞋', '托特', '电脑'],
  casual: ['休闲', '基础', '极简', '牛仔', '帆布', '运动', '宽松'],
  date: ['约会', '优雅', '甜美', '小包', '单肩', '裙'],
  travel: ['旅行', '轻便', '舒适', '双肩', '斜挎', '防皱', '百搭'],
  outdoor: ['户外', '运动', '防风', '防水', '徒步', '冲锋衣', '快干'],
  party: ['派对', '亮片', '华丽', '金属', '高饱和']
}

const TRAVEL_SCENE_TO_PROFILE: Record<string, PreferredScene> = {
  通勤: 'work',
  正式: 'work',
  休闲: 'casual',
  约会: 'date',
  户外: 'outdoor'
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[], fallback = 0) {
  if (values.length === 0) {
    return fallback
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function itemText(item: ClosetItemCardData) {
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

function hasToken(item: ClosetItemCardData, tokens: string[]) {
  const text = itemText(item)
  return tokens.some((token) => text.includes(normalizeInput(token)))
}

function getSelectedItems(outfit: EvaluatedOutfit) {
  return [
    outfit.dress ?? null,
    outfit.top ?? null,
    outfit.bottom ?? null,
    outfit.outerLayer ?? null,
    outfit.shoes ?? null,
    outfit.bag ?? null,
    ...(outfit.accessories ?? [])
  ].filter((item): item is ClosetItemCardData => item !== null)
}

function getSeasonMode(weather: TodayWeather | null | undefined): SeasonMode {
  if (!weather) {
    return 'neutral'
  }

  if (weather.isCold || weather.temperatureC <= 10) {
    return 'cold'
  }

  if (weather.isWarm || weather.temperatureC >= 24) {
    return 'hot'
  }

  if (weather.temperatureC >= 13 && weather.temperatureC <= 18) {
    return 'mildCool'
  }

  return 'neutral'
}

function getItemWarmthLevel(item: ClosetItemCardData) {
  if (item.algorithmMeta?.warmthLevel !== undefined) {
    return item.algorithmMeta.warmthLevel
  }

  if (hasToken(item, ['羽绒', '棉服', '大衣', '毛衣', '保暖', '冬', '厚', 'heavy', 'thermal'])) {
    return 4
  }

  if (hasToken(item, ['夹克', '风衣', '冲锋衣', '西装外套', '针织', '卫衣', '靴', '皮鞋', '乐福'])) {
    return 3
  }

  if (hasToken(item, ['衬衫', '长袖', '休闲裤', '西裤', '牛仔裤', '长裙', '运动鞋'])) {
    return 2
  }

  if (hasToken(item, ['t恤', '短袖', '轻薄', '夏', '短裤', '短裙', '凉鞋', '拖鞋', '背心', '吊带'])) {
    return 1
  }

  return 2
}

function getFormalityLevel(item: ClosetItemCardData) {
  if (item.algorithmMeta?.formality !== undefined) {
    return item.algorithmMeta.formality
  }

  if (hasToken(item, ['正式', '商务', '西装', '衬衫', '西裤', '托特', '皮鞋', '乐福', '高跟'])) {
    return 4
  }

  if (hasToken(item, ['通勤', '针织', '风衣', '大衣', '单肩'])) {
    return 3
  }

  if (hasToken(item, ['休闲', '基础', '牛仔', '帆布', '运动', 't恤', '短裤', '凉鞋', '拖鞋'])) {
    return 1
  }

  return 2
}

function getComfortLevel(item: ClosetItemCardData) {
  if (item.algorithmMeta?.comfortLevel !== undefined) {
    return item.algorithmMeta.comfortLevel
  }

  if (hasToken(item, ['舒适', '运动', '平底', '宽松', '柔软', '针织', '休闲', '徒步', 'sneaker', 'walking'])) {
    return 4
  }

  if (hasToken(item, ['高跟', '紧身', '皮鞋', '硬挺'])) {
    return 2
  }

  return 3
}

function getVisualWeight(item: ClosetItemCardData) {
  if (item.algorithmMeta?.visualWeight !== undefined) {
    return item.algorithmMeta.visualWeight
  }

  const role = getOutfitColorRole(item.colorCategory)

  if (item.algorithmMeta?.pattern && item.algorithmMeta.pattern !== 'solid') {
    return role === 'accent' ? 5 : 4
  }

  if (role === 'accent') {
    return 4
  }

  if (hasToken(item, ['logo', '大logo', '印花', '图案', '亮片', '金属', '高饱和'])) {
    return 4
  }

  return role === 'base' ? 2 : 3
}

function getPatternWeight(item: ClosetItemCardData) {
  const pattern = item.algorithmMeta?.pattern

  if (!pattern || pattern === 'solid') {
    return hasToken(item, ['logo', '印花', '图案', '条纹', '格纹']) ? 1 : 0
  }

  return pattern === 'graphic' || pattern === 'logo' || pattern === 'floral' ? 2 : 1
}

function isExposedWarmItem(item: ClosetItemCardData) {
  return hasToken(item, ['短裤', '短裙', '凉鞋', '拖鞋', '背心', '吊带', '无袖', '露脚', 'sandals', 'slides'])
}

function isHeavyWarmItem(item: ClosetItemCardData) {
  return hasToken(item, ['羽绒', '棉服', '大衣', '毛衣', '保暖', '厚', 'heavy', '冬'])
}

export function getItemFreshnessScore(item: ClosetItemCardData) {
  let score = 56

  if (!item.lastWornDate) {
    score += 22
  }

  score += Math.max(0, 6 - item.wearCount) * 4

  return clampScore(score)
}

export function getItemWeatherSuitability(item: ClosetItemCardData, weather: TodayWeather | null | undefined) {
  const mode = getSeasonMode(weather)

  if (mode === 'neutral') {
    return 76
  }

  const warmth = getItemWarmthLevel(item)
  let score = 78

  if (mode === 'hot') {
    score += (2 - warmth) * 9

    if (isHeavyWarmItem(item) || warmth >= 4) {
      score -= 36
    }

    if (isOuterwearCategory(item.category) && warmth >= 3) {
      score -= 18
    }
  } else if (mode === 'mildCool') {
    score += 12 - Math.abs(warmth - 2) * 9

    if (isExposedWarmItem(item)) {
      score -= isBottomCategory(item.category) || isShoesCategory(item.category) ? 44 : 30
    }

    if (isOuterwearCategory(item.category) && warmth >= 4) {
      score -= 18
    }
  } else {
    score += (warmth - 2) * 13

    if (isExposedWarmItem(item)) {
      score -= 56
    }

    if ((isTopCategory(item.category) || isBottomCategory(item.category) || isShoesCategory(item.category)) && warmth <= 1) {
      score -= 22
    }

    if (isOuterwearCategory(item.category) && warmth <= 2) {
      score -= 24
    }
  }

  if ((item.seasonTags ?? []).includes('夏') && mode !== 'hot') {
    score -= mode === 'cold' ? 22 : 10
  }

  if ((item.seasonTags ?? []).includes('冬') && mode === 'hot') {
    score -= 22
  }

  return clampScore(score)
}

function getSceneTargets(context: OutfitEvaluationContext) {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const fromTravel = (context.travelScenes ?? [])
    .map((scene) => TRAVEL_SCENE_TO_PROFILE[scene])
    .filter((scene): scene is PreferredScene => Boolean(scene))
  const scenes = context.scenes ?? (fromTravel.length > 0 ? fromTravel : profile.preferredScenes)

  return scenes.length > 0 ? [...new Set(scenes)] : profile.preferredScenes
}

export function getItemSceneFit(item: ClosetItemCardData, context: OutfitEvaluationContext = {}) {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const scenes = getSceneTargets(context)
  const text = itemText(item)
  const wantedTokens = scenes.flatMap((scene) => SCENE_TOKENS[scene] ?? [])
  const tokenScore = wantedTokens.some((token) => text.includes(normalizeInput(token))) ? 24 : 0
  const formality = getFormalityLevel(item)
  const comfort = getComfortLevel(item)
  let score = 58 + tokenScore

  if (scenes.includes('work')) {
    score += formality >= 3 ? 14 : -16
  }

  if (scenes.includes('outdoor') || scenes.includes('travel')) {
    score += comfort >= 4 ? 12 : -6
  }

  if (scenes.includes('casual') && formality <= 2) {
    score += 8
  }

  if (profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority) {
    score += (comfort - 3) * 4
  }

  return clampScore(score)
}

export function rankItemsForRecommendation(
  items: ClosetItemCardData[],
  context: OutfitEvaluationContext = {}
) {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const prefersSubtleFocus = profile.focalPointPreference === 'subtle' || profile.colorPreference.accentTolerance === 0

  return [...items].sort((left, right) => {
    const scoreItem = (item: ClosetItemCardData) => {
      const visualWeight = getVisualWeight(item)
      const visualScore = prefersSubtleFocus ? (5 - visualWeight) * 3 : visualWeight * 2

      return (
        getItemWeatherSuitability(item, context.weather) * 0.42 +
        getItemSceneFit(item, context) * 0.24 +
        getItemFreshnessScore(item) * 0.18 +
        getComfortLevel(item) * 4 +
        visualScore
      )
    }
    const scoreDelta = scoreItem(right) - scoreItem(left)

    if (Math.abs(scoreDelta) >= 0.01) {
      return scoreDelta
    }

    if (left.wearCount !== right.wearCount) {
      return left.wearCount - right.wearCount
    }

    return right.createdAt.localeCompare(left.createdAt)
  })
}

export function filterWeatherSuitableItems(
  items: ClosetItemCardData[],
  weather: TodayWeather | null | undefined,
  threshold = 52
) {
  if (!weather) {
    return items
  }

  const suitable = items.filter((item) => getItemWeatherSuitability(item, weather) >= threshold)

  return suitable.length > 0 ? suitable : items
}

function getColorCluster(color: string | null | undefined) {
  const definition = getColorDefinition(color)

  if (!definition || definition.value === UNKNOWN_COLOR) {
    return 'unknown'
  }

  if (['白色', '浅灰色', '灰色', '深灰色', '黑色'].includes(definition.value)) {
    return 'achromatic'
  }

  if (['米白色', '米色', '卡其色', '驼色', '棕色', '深棕色'].includes(definition.value)) {
    return 'warmNeutral'
  }

  return definition.family
}

export function hasTonalColorRelationship(left: string | null | undefined, right: string | null | undefined) {
  const leftDefinition = getColorDefinition(left)
  const rightDefinition = getColorDefinition(right)

  if (!leftDefinition || !rightDefinition) {
    return false
  }

  if (leftDefinition.family !== rightDefinition.family) {
    return false
  }

  if (leftDefinition.family === 'neutral') {
    return getColorCluster(leftDefinition.value) === getColorCluster(rightDefinition.value)
  }

  return true
}

function scoreColorHarmony(outfit: EvaluatedOutfit, profile: PreferenceProfile) {
  const items = getSelectedItems(outfit)

  if (items.length <= 1) {
    return 64
  }

  const pairScores: number[] = []
  let tonalPairs = 0

  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
      const left = items[leftIndex]
      const right = items[rightIndex]
      pairScores.push(scoreColorCompatibility(left.colorCategory, right.colorCategory))

      if (hasTonalColorRelationship(left.colorCategory, right.colorCategory)) {
        tonalPairs += 1
      }
    }
  }

  const roles = items.map((item) => getOutfitColorRole(item.colorCategory))
  const baseCount = roles.filter((role) => role === 'base').length
  const accentCount = roles.filter((role) => role === 'accent').length
  const patternCount = items.filter((item) => getPatternWeight(item) > 0).length
  let score = 46 + average(pairScores, 1.6) * 11

  if (baseCount >= 1) {
    score += 10
  }

  if (tonalPairs > 0) {
    score += Math.min(12, tonalPairs * 5)
  }

  if (accentCount === profile.colorPreference.accentTolerance) {
    score += 6
  } else if (accentCount > profile.colorPreference.accentTolerance) {
    score -= (accentCount - profile.colorPreference.accentTolerance) * 12
  }

  if (patternCount > 1) {
    score -= (patternCount - 1) * 9
  }

  return clampScore(score)
}

function matchSilhouettePreference(profile: PreferenceProfile, items: ClosetItemCardData[]) {
  const text = items.map(itemText).join(' ')
  const silhouette = items.flatMap((item) => item.algorithmMeta?.silhouette ?? []).map(normalizeInput)

  return profile.silhouettePreference.some((preference) => {
    if (preference === 'shortTopHighWaist') {
      return text.includes('短') || text.includes('高腰') || silhouette.some((token) => token.includes('短') || token.includes('高腰'))
    }

    if (preference === 'looseTopSlimBottom') {
      return text.includes('宽松') || text.includes('修身')
    }

    if (preference === 'fittedTopWideBottom') {
      return text.includes('修身') || text.includes('直筒') || text.includes('宽松')
    }

    if (preference === 'relaxedAll') {
      return text.includes('宽松') || text.includes('松弛') || text.includes('垂坠')
    }

    return items.some((item) => isOnePieceCategory(item.category))
  })
}

function scoreSilhouetteBalance(outfit: EvaluatedOutfit, profile: PreferenceProfile) {
  const items = getSelectedItems(outfit)

  if (items.length === 0) {
    return 30
  }

  if ((outfit.missingSlots ?? []).some((slot) => slot === 'top' || slot === 'bottom' || slot === 'dress')) {
    return outfit.top || outfit.bottom || outfit.dress ? 48 : 34
  }

  let score = outfit.dress ? 78 : 72
  const visualWeights = items.filter((item) => !isAccessoryCategory(item.category)).map(getVisualWeight)
  const visualSpread = Math.max(...visualWeights) - Math.min(...visualWeights)

  if (visualSpread <= 2) {
    score += 8
  } else {
    score -= Math.min(16, visualSpread * 4)
  }

  if (outfit.top && outfit.bottom) {
    const topText = itemText(outfit.top)
    const bottomText = itemText(outfit.bottom)

    if ((topText.includes('短') && bottomText.includes('高腰')) || (topText.includes('宽松') && (bottomText.includes('修身') || bottomText.includes('直筒')))) {
      score += 8
    }
  }

  if (matchSilhouettePreference(profile, items)) {
    score += 10
  }

  return clampScore(score)
}

function scoreLayering(outfit: EvaluatedOutfit, context: OutfitEvaluationContext, profile: PreferenceProfile) {
  const mode = getSeasonMode(context.weather)
  const hasOuter = Boolean(outfit.outerLayer)
  const layerRoles = getSelectedItems(outfit).map((item) => item.algorithmMeta?.layerRole).filter(Boolean)
  const hasExplicitLayer = layerRoles.includes('outer') || layerRoles.includes('mid')
  let score = hasExplicitLayer ? 78 : 70

  if (mode === 'cold') {
    score += hasOuter ? 22 : -32
  } else if (mode === 'mildCool') {
    score += hasOuter ? 16 : -18
  } else if (mode === 'hot') {
    score += hasOuter ? -22 : 14
  } else if (profile.layeringPreference.allowNonWeatherOuterwear && profile.layeringPreference.complexity >= 2) {
    score += hasOuter ? 10 : -4
  }

  if (profile.layeringPreference.complexity === 0 && hasOuter && mode !== 'cold' && mode !== 'mildCool') {
    score -= 14
  }

  return clampScore(score)
}

function scoreFocalPoint(outfit: EvaluatedOutfit, profile: PreferenceProfile) {
  const items = getSelectedItems(outfit)
  const focusItems = items.filter((item) => {
    return getOutfitColorRole(item.colorCategory) === 'accent' || getVisualWeight(item) >= 4 || getPatternWeight(item) >= 1 || item.algorithmMeta?.layerRole === 'statement'
  })
  const focusCount = focusItems.length
  const preferred = profile.focalPointPreference
  let score = 74

  if (preferred === 'subtle') {
    score += focusCount <= 1 ? 12 : -18
  } else if (preferred === 'upperBody') {
    score += focusItems.some((item) => isTopCategory(item.category) || isOuterwearCategory(item.category)) ? 16 : -8
  } else if (preferred === 'waist') {
    score += outfit.top && outfit.bottom ? 10 : -8
  } else if (preferred === 'shoes') {
    score += focusItems.some((item) => isShoesCategory(item.category)) || outfit.shoes ? 16 : -14
  } else if (preferred === 'bagAccessory') {
    score += focusItems.some((item) => isBagCategory(item.category) || isAccessoryCategory(item.category)) || outfit.bag ? 16 : -12
  }

  if (focusCount > Math.max(1, profile.colorPreference.accentTolerance + 1)) {
    score -= (focusCount - 1) * 8
  }

  return clampScore(score)
}

function scoreSceneFit(outfit: EvaluatedOutfit, context: OutfitEvaluationContext) {
  const items = getSelectedItems(outfit)

  if (items.length === 0) {
    return 30
  }

  const itemScores = items.map((item) => getItemSceneFit(item, context))
  const coreItems = [outfit.dress, outfit.top, outfit.bottom, outfit.outerLayer].filter((item): item is ClosetItemCardData => Boolean(item))
  const scenes = getSceneTargets(context)
  let score = average(itemScores, 64)

  if (scenes.includes('work')) {
    const formalCore = coreItems.filter((item) => getFormalityLevel(item) >= 3).length
    score += formalCore >= Math.min(2, coreItems.length) ? 8 : -10
  }

  if (scenes.includes('outdoor') || scenes.includes('travel')) {
    const comfortCore = coreItems.filter((item) => getComfortLevel(item) >= 3).length
    score += comfortCore >= Math.min(2, coreItems.length) ? 8 : -6
  }

  return clampScore(score)
}

function scoreWeatherComfort(outfit: EvaluatedOutfit, weather: TodayWeather | null | undefined) {
  const items = getSelectedItems(outfit)

  if (items.length === 0) {
    return 30
  }

  const mode = getSeasonMode(weather)
  let score = average(items.map((item) => getItemWeatherSuitability(item, weather)), 76)

  if (mode === 'cold') {
    score += outfit.outerLayer ? 9 : -28
  } else if (mode === 'mildCool') {
    score += outfit.outerLayer ? 8 : -10
  } else if (mode === 'hot' && outfit.outerLayer) {
    score -= 12
  }

  return clampScore(score)
}

function scoreCompleteness(outfit: EvaluatedOutfit) {
  const missingSlots = outfit.missingSlots ?? []
  const coreMissing = missingSlots.filter((slot) => slot === 'top' || slot === 'bottom' || slot === 'dress').length
  const optionalMissing = missingSlots.length - coreMissing

  return clampScore(100 - coreMissing * 30 - optionalMissing * 12)
}

function scoreFreshness(outfit: EvaluatedOutfit) {
  const items = getSelectedItems(outfit)

  return clampScore(average(items.map(getItemFreshnessScore), 58))
}

export function evaluateOutfit(outfit: EvaluatedOutfit, context: OutfitEvaluationContext = {}) {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const evaluationContext = { ...context, profile }
  const componentScores: ScoreWeights = {
    colorHarmony: scoreColorHarmony(outfit, profile),
    silhouetteBalance: scoreSilhouetteBalance(outfit, profile),
    layering: scoreLayering(outfit, evaluationContext, profile),
    focalPoint: scoreFocalPoint(outfit, profile),
    sceneFit: scoreSceneFit(outfit, evaluationContext),
    weatherComfort: scoreWeatherComfort(outfit, context.weather),
    completeness: scoreCompleteness(outfit),
    freshness: scoreFreshness(outfit)
  }

  return { componentScores }
}

export function getWeightedOutfitScore(
  componentScores: ScoreWeights,
  weights: ScoreWeights = DEFAULT_RECOMMENDATION_WEIGHTS
) {
  return Object.entries(weights).reduce((score, [key, weight]) => {
    return score + componentScores[key as keyof ScoreWeights] * weight
  }, 0)
}
