import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  getOutfitColorRole,
  normalizeInput
} from '@/lib/closet/taxonomy'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import {
  evaluateOutfit,
  getItemFreshnessScore,
  getItemSceneFit,
  getItemWeatherSuitability,
  getWeightedOutfitScore,
  type EvaluatedOutfit
} from '@/lib/recommendation/outfit-evaluator'
import {
  EMPTY_MODEL_SCORES,
  RECOMMENDATION_RULE_WEIGHTS,
  type RecommendationCandidate,
  type RecommendationCompatibilityScores,
  type RecommendationModelScores,
  type RecommendationPenalty,
  type RecommendationResult,
  type RecommendationRuleScores,
  type RecommendationScoringContext,
  type RecommendationScoreBreakdown,
  type RecommendationStrategyKey
} from '@/lib/recommendation/canonical-types'
import { getLearningSignalScoreAdjustment, hasHiddenItemSignal } from '@/lib/recommendation/learning-signals'
import { scoreRecommendationStrategies, type StrategyScoreResult } from '@/lib/recommendation/strategy-scorers'
import type { PreferenceProfile, ScoreWeights } from '@/lib/recommendation/preference-types'

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[], fallback = 60) {
  if (values.length === 0) {
    return fallback
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const PRIMARY_STRATEGY_GENERIC_PENALTY: Partial<Record<RecommendationStrategyKey, number>> = {
  capsuleWardrobe: 18,
  outfitFormula: 6,
  twoThirdRule: 4
}

function getRecallSourcePrimaryBoost(key: RecommendationStrategyKey, context: RecommendationScoringContext) {
  if (context.recallSource === 'formula' && key === 'outfitFormula') {
    return 14
  }

  if (context.recallSource === 'exploration' && key === 'pinterestRecreation') {
    return 16
  }

  if (context.recallSource === 'weather' && (key === 'layering' || key === 'occasionNiche')) {
    return 8
  }

  if (context.formulaId && key === 'outfitFormula') {
    return 8
  }

  return 0
}

function selectPrimaryStrategy(results: StrategyScoreResult[], context: RecommendationScoringContext) {
  const eligible = results.filter((result) => result.score >= 72)

  if (eligible.length === 0) {
    return null
  }

  const averageScore = average(results.map((result) => result.score), 60)
  const ranked = eligible
    .map((result) => {
      const distinctiveness = Math.max(0, result.score - averageScore)
      const genericPenalty = PRIMARY_STRATEGY_GENERIC_PENALTY[result.key] ?? 0
      const recallBoost = getRecallSourcePrimaryBoost(result.key, context)

      return {
        ...result,
        primaryScore: result.score + distinctiveness * 0.55 + recallBoost - genericPenalty
      }
    })
    .sort((left, right) => {
      if (right.primaryScore !== left.primaryScore) {
        return right.primaryScore - left.primaryScore
      }

      return right.score - left.score
    })

  const best = ranked[0]

  if (!best) {
    return null
  }

  if (best.key === 'capsuleWardrobe') {
    const bestNonCapsule = ranked.find((result) => result.key !== 'capsuleWardrobe')

    if (bestNonCapsule && bestNonCapsule.score >= best.score - 8) {
      return bestNonCapsule.key
    }
  }

  return best.key
}

function buildStrategySummaryKeys(results: StrategyScoreResult[], primaryStrategy: RecommendationStrategyKey | null) {
  const summaryKeys = primaryStrategy ? [primaryStrategy] : []

  for (const result of [...results].sort((left, right) => right.score - left.score)) {
    if (result.score < 72 || summaryKeys.includes(result.key)) {
      continue
    }

    summaryKeys.push(result.key)

    if (summaryKeys.length >= 3) {
      break
    }
  }

  return summaryKeys
}

function selectedItems(outfit: EvaluatedOutfit) {
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

function hasToken(text: string, tokens: string[]) {
  const normalizedText = normalizeInput(text)
  return tokens.some((token) => normalizedText.includes(normalizeInput(token)))
}

function formalityLevel(item: ClosetItemCardData) {
  if (item.algorithmMeta?.formality !== undefined) {
    return item.algorithmMeta.formality
  }

  const text = itemText(item)

  if (hasToken(text, ['晚宴', '礼服', '高跟', '西装', '商务', '正式'])) {
    return 5
  }

  if (hasToken(text, ['衬衫', '西裤', '乐福', '皮鞋', '托特', '通勤'])) {
    return 4
  }

  if (hasToken(text, ['牛仔', '针织', '单肩', '夹克'])) {
    return 3
  }

  if (hasToken(text, ['运动', 't恤', '卫衣', '休闲', '拖鞋', '帆布'])) {
    return 2
  }

  return 3
}

function materialSeasonScore(items: ClosetItemCardData[]) {
  const materialTokens = items.flatMap((item) => item.algorithmMeta?.material ?? [])
  const text = items.map(itemText).join(' ')

  if (materialTokens.length === 0 && !text) {
    return 62
  }

  if (hasToken(text, ['羊毛', '呢', '羽绒', '棉服', '亚麻', '真丝', '皮革', 'denim', 'cotton', 'linen', 'wool'])) {
    return 78
  }

  return 66
}

function patternScore(items: ClosetItemCardData[]) {
  const patternItems = items.filter((item) => {
    const pattern = item.algorithmMeta?.pattern
    return pattern && pattern !== 'solid' || hasToken(itemText(item), ['印花', '图案', '条纹', '格纹', 'logo'])
  })

  if (patternItems.length === 0) {
    return 78
  }

  return clampScore(82 - Math.max(0, patternItems.length - 1) * 18)
}

function shoesBagScore(outfit: EvaluatedOutfit) {
  if (!outfit.shoes && !outfit.bag) {
    return 48
  }

  if (!outfit.shoes || !outfit.bag) {
    return 66
  }

  const shoeRole = getOutfitColorRole(outfit.shoes.colorCategory)
  const bagRole = getOutfitColorRole(outfit.bag.colorCategory)
  const sameRole = shoeRole === bagRole
  const formalityGap = Math.abs(formalityLevel(outfit.shoes) - formalityLevel(outfit.bag))

  return clampScore(72 + (sameRole ? 10 : 0) - formalityGap * 6)
}

function styleDistanceScore(items: ClosetItemCardData[], profile: PreferenceProfile) {
  const text = items.map(itemText).join(' ')
  const hardAvoidHit = profile.hardAvoids.some((avoid) => avoid.trim() && text.includes(normalizeInput(avoid)))

  if (hardAvoidHit) {
    return 0
  }

  const styleTags = items.flatMap((item) => item.styleTags.map(normalizeInput))
  const repeatedStyle = styleTags.some((tag, index) => styleTags.indexOf(tag) !== index)
  const vividCount = items.filter((item) => getOutfitColorRole(item.colorCategory) === 'accent').length
  const colorPenalty = vividCount > profile.colorPreference.accentTolerance ? (vividCount - profile.colorPreference.accentTolerance) * 12 : 0

  return clampScore((repeatedStyle ? 78 : 64) - colorPenalty)
}

function buildPenalties(outfit: EvaluatedOutfit, context: RecommendationScoringContext, componentScores: ScoreWeights): RecommendationPenalty[] {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const items = selectedItems(outfit)
  const text = items.map(itemText).join(' ')
  const penalties: RecommendationPenalty[] = []
  const hardAvoid = profile.hardAvoids.find((avoid) => avoid.trim() && text.includes(normalizeInput(avoid)))

  if (hardAvoid) {
    penalties.push({ key: 'hardAvoid', value: 100, reason: `命中用户避雷：${hardAvoid}` })
  }

  if (hasHiddenItemSignal(outfit, context.learningSignals)) {
    penalties.push({ key: 'hiddenItem', value: 100, reason: '命中用户隐藏单品' })
  }

  if (componentScores.weatherComfort < 52) {
    penalties.push({ key: 'weatherMismatch', value: 28, reason: '天气适配低于安全线' })
  }

  if (componentScores.completeness < 58) {
    penalties.push({ key: 'incompleteCore', value: 18, reason: '核心穿搭 slot 不完整' })
  }

  if (componentScores.colorHarmony < 48) {
    penalties.push({ key: 'colorConflict', value: 14, reason: '配色冲突过高' })
  }

  return penalties
}

function learningContextKeys(context: RecommendationScoringContext) {
  return [
    context.surface,
    ...(context.scenes ?? []),
    ...(context.travelScenes ?? [])
  ].filter((key): key is string => Boolean(key))
}

function buildCompatibilityScores(outfit: EvaluatedOutfit, context: RecommendationScoringContext, componentScores: ScoreWeights): RecommendationCompatibilityScores {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const items = selectedItems(outfit)
  const formalityValues = items.map(formalityLevel)
  const formalitySpread = formalityValues.length ? Math.max(...formalityValues) - Math.min(...formalityValues) : 0

  return {
    color: componentScores.colorHarmony,
    silhouette: componentScores.silhouetteBalance,
    material: materialSeasonScore(items),
    formality: clampScore(82 - formalitySpread * 9),
    styleDistance: styleDistanceScore(items, profile),
    pattern: patternScore(items),
    shoesBag: shoesBagScore(outfit),
    temperature: componentScores.weatherComfort,
    scene: componentScores.sceneFit
  }
}

function buildRuleScores({
  outfit,
  context,
  componentScores,
  compatibilityScores,
  strategyAverage,
  trendScore,
  explanationQuality
}: {
  outfit: EvaluatedOutfit
  context: RecommendationScoringContext
  componentScores: ScoreWeights
  compatibilityScores: RecommendationCompatibilityScores
  strategyAverage: number
  trendScore: number
  explanationQuality: number
}): RecommendationRuleScores {
  const profile = context.profile ?? DEFAULT_PREFERENCE_PROFILE
  const items = selectedItems(outfit)
  const sceneScores = items.map((item) => getItemSceneFit(item, {
    profile,
    weather: context.weather,
    travelScenes: context.travelScenes
  }))
  const weatherScores = items.map((item) => getItemWeatherSuitability(item, context.weather))
  const freshnessScores = items.map(getItemFreshnessScore)
  const learningAdjustment = getLearningSignalScoreAdjustment({
    outfit,
    signals: context.learningSignals,
    contextKeys: learningContextKeys(context)
  })

  return {
    contextFit: clampScore(average(sceneScores, componentScores.sceneFit) * 0.7 + componentScores.sceneFit * 0.3),
    visualCompatibility: clampScore(average([
      compatibilityScores.color,
      compatibilityScores.silhouette,
      compatibilityScores.material,
      compatibilityScores.formality,
      compatibilityScores.pattern,
      compatibilityScores.shoesBag
    ])),
    userPreference: clampScore(average([compatibilityScores.styleDistance, componentScores.focalPoint, componentScores.layering]) + learningAdjustment),
    outfitStrategy: clampScore(strategyAverage),
    weatherPracticality: clampScore(average(weatherScores, componentScores.weatherComfort)),
    novelty: componentScores.freshness,
    wardrobeRotation: clampScore(average(freshnessScores, 58)),
    trendOverlay: trendScore,
    explanationQuality
  }
}

function getRuleBaselineScore(ruleScores: RecommendationRuleScores, penalties: RecommendationPenalty[]) {
  const weightedScore = Object.entries(RECOMMENDATION_RULE_WEIGHTS).reduce((score, [key, weight]) => {
    return score + ruleScores[key as keyof RecommendationRuleScores] * weight
  }, 0)
  const penaltyValue = penalties.reduce((sum, penalty) => sum + penalty.value, 0)

  return clampScore(weightedScore - penaltyValue)
}

export function blendModelAndRuleScore({
  ruleBaselineScore,
  modelScores
}: {
  ruleBaselineScore: number
  modelScores?: Partial<RecommendationModelScores> | null
}) {
  const normalizedModelScores: RecommendationModelScores = {
    ...EMPTY_MODEL_SCORES,
    ...modelScores,
    modelRunId: modelScores?.modelRunId ?? null,
    status: modelScores?.status ?? 'missing'
  }
  const hasActiveScores =
    normalizedModelScores.status === 'active' &&
    typeof normalizedModelScores.xgboostScore === 'number' &&
    typeof normalizedModelScores.lightfmScore === 'number' &&
    typeof normalizedModelScores.implicitScore === 'number'

  if (!hasActiveScores) {
    return {
      totalScore: ruleBaselineScore,
      modelScores: {
        ...normalizedModelScores,
        ruleScore: ruleBaselineScore,
        finalScore: ruleBaselineScore
      },
      riskFlag: normalizedModelScores.status === 'missing' ? 'model_fallback_missing' : `model_fallback_${normalizedModelScores.status}`
    }
  }

  const xgboostScore = normalizedModelScores.xgboostScore ?? 0
  const lightfmScore = normalizedModelScores.lightfmScore ?? 0
  const implicitScore = normalizedModelScores.implicitScore ?? 0
  const totalScore = clampScore(
    xgboostScore * 0.72 +
      lightfmScore * 0.12 +
      implicitScore * 0.1 +
      ruleBaselineScore * 0.06
  )

  return {
    totalScore,
    modelScores: {
      ...normalizedModelScores,
      ruleScore: ruleBaselineScore,
      finalScore: totalScore
    },
    riskFlag: null
  }
}

export function scoreRecommendationCandidate(
  candidate: RecommendationCandidate,
  modelScores?: Partial<RecommendationModelScores> | null
): RecommendationResult {
  const context = {
    ...candidate.context,
    surface: candidate.surface,
    profile: candidate.context?.profile ?? DEFAULT_PREFERENCE_PROFILE
  }
  const componentScores = evaluateOutfit(candidate.outfit, {
    weather: context.weather,
    profile: context.profile,
    travelScenes: context.travelScenes
  }).componentScores
  const compatibilityScores = buildCompatibilityScores(candidate.outfit, context, componentScores)
  const strategyEvaluation = scoreRecommendationStrategies(candidate.outfit, context)
  const strategyResults = strategyEvaluation.results
  const strategyAverage = average(strategyResults.map((result) => result.score), 60)
  const primaryStrategy = selectPrimaryStrategy(strategyResults, context)
  const strategySummaryKeys = buildStrategySummaryKeys(strategyResults, primaryStrategy)
  const explanationResults = [
    primaryStrategy ? strategyResults.find((result) => result.key === primaryStrategy) ?? null : null,
    ...strategyResults
      .filter((result) => result.score >= 72 && result.key !== primaryStrategy)
      .sort((left, right) => right.score - left.score)
  ].filter((result): result is StrategyScoreResult => Boolean(result))
  const explanation = explanationResults
    .slice(0, 4)
    .map((result) => result.explanation)
  const explanationQuality = clampScore(56 + Math.min(34, explanation.length * 10))
  const penalties = buildPenalties(candidate.outfit, context, componentScores)
  const ruleScores = buildRuleScores({
    outfit: candidate.outfit,
    context,
    componentScores,
    compatibilityScores,
    strategyAverage,
    trendScore: strategyEvaluation.scoreMap.trendOverlay,
    explanationQuality
  })
  const ruleBaselineScore = getRuleBaselineScore(ruleScores, penalties)
  const hardConstraintPenalty = penalties.some((penalty) => penalty.key === 'hardAvoid' || penalty.key === 'weatherMismatch' || penalty.key === 'hiddenItem')
  const blended = hardConstraintPenalty
    ? blendModelAndRuleScore({
        ruleBaselineScore,
        modelScores: {
          ...modelScores,
          status: 'low_quality'
        }
      })
    : blendModelAndRuleScore({ ruleBaselineScore, modelScores })
  const riskFlags = [
    ...penalties.map((penalty) => penalty.key),
    blended.riskFlag
  ].filter((flag): flag is string => Boolean(flag))
  const scoreBreakdown: RecommendationScoreBreakdown = {
    totalScore: blended.totalScore,
    ruleBaselineScore,
    modelScores: blended.modelScores,
    ruleScores,
    compatibilityScores,
    strategyScores: strategyEvaluation.scoreMap,
    primaryStrategy,
    strategySummaryKeys,
    componentScores,
    penalties,
    explanation: explanation.length > 0 ? explanation : ['这套主要由规则基线兜底推荐，模型或策略信号不足时仍保持可解释。'],
    riskFlags
  }

  return {
    ...candidate,
    scoreBreakdown
  }
}

export function getLegacyWeightedRuleScore(componentScores: ScoreWeights, weights = DEFAULT_RECOMMENDATION_WEIGHTS) {
  return getWeightedOutfitScore(componentScores, weights)
}
