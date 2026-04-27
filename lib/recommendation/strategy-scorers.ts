import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  getColorDefinition,
  getColorIntensity,
  getOutfitColorRole,
  isAccessoryCategory,
  isBagCategory,
  normalizeInput,
} from '@/lib/closet/taxonomy'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'
import type { EvaluatedOutfit } from '@/lib/recommendation/outfit-evaluator'
import {
  getItemSceneFit,
  getItemWeatherSuitability,
  hasTonalColorRelationship
} from '@/lib/recommendation/outfit-evaluator'
import type {
  RecommendationScoringContext,
  RecommendationStrategyKey,
  RecommendationStrategyScores
} from '@/lib/recommendation/canonical-types'
import { RECOMMENDATION_STRATEGY_KEYS } from '@/lib/recommendation/canonical-types'
import { DEFAULT_RECOMMENDATION_TRENDS, getTrendSearchTags } from '@/lib/recommendation/trends'
import type { PreferenceProfile } from '@/lib/recommendation/preference-types'

export type StrategyScoreResult = {
  key: RecommendationStrategyKey
  score: number
  explanation: string
  riskFlags?: string[]
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values: number[], fallback = 60) {
  if (values.length === 0) {
    return fallback
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
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

function outfitText(outfit: EvaluatedOutfit) {
  return selectedItems(outfit).map(itemText).join(' ')
}

function hasToken(text: string, tokens: string[]) {
  const normalizedText = normalizeInput(text)
  return tokens.some((token) => normalizedText.includes(normalizeInput(token)))
}

function getProfile(context: RecommendationScoringContext = {}) {
  return context.profile ?? DEFAULT_PREFERENCE_PROFILE
}

function getColorCluster(color: string | null | undefined) {
  const definition = getColorDefinition(color)

  if (!definition) {
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

function comfortLevel(item: ClosetItemCardData) {
  if (item.algorithmMeta?.comfortLevel !== undefined) {
    return item.algorithmMeta.comfortLevel
  }

  return hasToken(itemText(item), ['舒适', '运动', '平底', '宽松', '柔软', '针织', '徒步', 'sneaker', 'flat']) ? 4 : 3
}

function visualWeight(item: ClosetItemCardData) {
  if (item.algorithmMeta?.visualWeight !== undefined) {
    return item.algorithmMeta.visualWeight
  }

  const role = getOutfitColorRole(item.colorCategory)
  const text = itemText(item)

  if (role === 'accent' || hasToken(text, ['logo', '印花', '图案', '亮片', '金属', '高饱和'])) {
    return 4
  }

  return role === 'base' ? 2 : 3
}

function scoreCapsuleWardrobe(outfit: EvaluatedOutfit): StrategyScoreResult {
  const items = selectedItems(outfit)
  const colors = items.map((item) => item.colorCategory)
  const baseColors = colors.filter((color) => getOutfitColorRole(color) === 'base').length
  const styleTags = items.flatMap((item) => item.styleTags)
  const repeatedStyle = styleTags.some((tag, index) => styleTags.indexOf(tag) !== index)
  const reusableItems = items.filter((item) => {
    const text = itemText(item)

    return getOutfitColorRole(item.colorCategory) !== 'accent' && (
      item.wearCount >= 2 ||
      hasToken(text, ['基础', '通勤', '极简', 'classic', 'minimal', 'basic', '百搭'])
    )
  }).length
  const baseColorRatio = items.length > 0 ? baseColors / items.length : 0
  const reusableRatio = items.length > 0 ? reusableItems / items.length : 0
  const slotCoverage = [
    outfit.dress || (outfit.top && outfit.bottom),
    outfit.shoes,
    outfit.bag || (outfit.accessories ?? []).length > 0
  ].filter(Boolean).length
  const completionBonus = slotCoverage >= 3 ? 8 : slotCoverage === 2 ? 4 : 0
  const score = clampScore(
    34 +
    baseColorRatio * 30 +
    reusableRatio * 24 +
    (repeatedStyle ? 14 : 0) +
    completionBonus
  )

  return {
    key: 'capsuleWardrobe',
    score,
    explanation: score >= 72 ? '胶囊衣橱策略成立：基础色和可复用单品能支持多场景复穿。' : '胶囊衣橱策略偏弱：基础锚点或复用性还不够稳定。'
  }
}

function scoreOutfitFormula(outfit: EvaluatedOutfit): StrategyScoreResult {
  const hasSeparates = Boolean(outfit.top && outfit.bottom)
  const hasOnePiece = Boolean(outfit.dress)
  const hasShoe = Boolean(outfit.shoes)
  const hasOuter = Boolean(outfit.outerLayer)
  const text = outfitText(outfit)
  const formulaMatch =
    (hasSeparates && hasShoe) ||
    (hasOnePiece && hasShoe) ||
    (hasOuter && hasSeparates) ||
    hasToken(text, ['衬衫', '针织', '牛仔', '西装外套', '乐福', '靴'])
  const score = clampScore(formulaMatch ? 82 + (hasOuter ? 6 : 0) : selectedItems(outfit).length >= 2 ? 58 : 34)

  return {
    key: 'outfitFormula',
    score,
    explanation: formulaMatch ? '穿搭公式命中：核心 slot 组合能形成稳定可复用公式。' : '穿搭公式不足：目前更像单品想法，还不是完整公式。'
  }
}

function scoreThreeWordStyle(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const profile = getProfile(context)
  const sceneTokens: Record<PreferenceProfile['preferredScenes'][number], string[]> = {
    work: ['通勤', '正式', '商务', 'classic', 'minimal'],
    casual: ['休闲', '基础', '极简', 'relaxed'],
    date: ['约会', '优雅', 'romantic'],
    travel: ['旅行', '轻便', 'relaxed'],
    outdoor: ['户外', '运动', 'gorpcore'],
    party: ['派对', '华丽', 'glam']
  }
  const wanted = profile.preferredScenes.flatMap((scene) => sceneTokens[scene] ?? [])
  const text = outfitText(outfit)
  const matchCount = wanted.filter((token) => hasToken(text, [token])).length
  const score = clampScore(wanted.length === 0 ? 62 : 52 + Math.min(36, matchCount * 14))

  return {
    key: 'threeWordStyle',
    score,
    explanation: score >= 72 ? '三词风格匹配：这套和用户日常风格词有稳定交集。' : '三词风格匹配一般：这套更像风格拓展。'
  }
}

function scorePersonalColorPalette(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const profile = getProfile(context)
  const items = selectedItems(outfit)
  const intensities = items.map((item) => getColorIntensity(item.colorCategory))
  const accentCount = items.filter((item) => getOutfitColorRole(item.colorCategory) === 'accent').length
  const vividCount = intensities.filter((value) => value === 'vivid').length
  const palette = profile.colorPreference.palette
  let score = 68

  if (palette === 'neutral') {
    score += accentCount === 0 ? 18 : -vividCount * 16
  } else if (palette === 'tonal') {
    const colors = items.map((item) => item.colorCategory)
    score += colors.some((color, index) => colors.slice(index + 1).some((next) => hasTonalColorRelationship(color, next))) ? 18 : -8
  } else if (palette === 'oneAccent') {
    score += accentCount === 1 ? 16 : -Math.abs(accentCount - 1) * 12
  } else if (palette === 'boldContrast') {
    score += vividCount >= 1 ? 16 : -8
  }

  return {
    key: 'personalColorPalette',
    score: clampScore(score),
    explanation: score >= 72 ? '个人色彩偏好匹配：颜色风险和重点色数量符合用户设定。' : '个人色彩偏好偏离：颜色强度或重点色数量需要谨慎。'
  }
}

function scoreSandwichDressing(outfit: EvaluatedOutfit): StrategyScoreResult {
  const top = outfit.top ?? outfit.dress ?? outfit.outerLayer ?? null
  const shoeOrBag = outfit.shoes ?? outfit.bag ?? null
  const topCluster = getColorCluster(top?.colorCategory)
  const bottom = outfit.bottom ?? null
  const middleCluster = getColorCluster(bottom?.colorCategory)
  const endCluster = getColorCluster(shoeOrBag?.colorCategory)
  const colorSandwich = Boolean(top && shoeOrBag && topCluster !== 'unknown' && topCluster === endCluster && middleCluster !== topCluster)
  const textureSandwich = Boolean(top && shoeOrBag && top.algorithmMeta?.fabricWeight && top.algorithmMeta.fabricWeight === shoeOrBag.algorithmMeta?.fabricWeight)
  const score = clampScore(colorSandwich || textureSandwich ? 88 : top && shoeOrBag ? 58 : 38)

  return {
    key: 'sandwichDressing',
    score,
    explanation: score >= 80 ? '三明治穿搭成立：上下元素形成呼应，中间层负责打断。' : '三明治穿搭不明显：上下呼应还不够清楚。'
  }
}

function scoreWrongShoeTheory(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const shoe = outfit.shoes

  if (!shoe) {
    return { key: 'wrongShoeTheory', score: 42, explanation: '错鞋理论无法判断：当前没有鞋履 slot。' }
  }

  const coreItems = [outfit.dress, outfit.top, outfit.bottom, outfit.outerLayer].filter((item): item is ClosetItemCardData => Boolean(item))
  const coreFormality = average(coreItems.map(formalityLevel), 3)
  const shoeFormality = formalityLevel(shoe)
  const distance = Math.abs(coreFormality - shoeFormality)
  const weatherScore = getItemWeatherSuitability(shoe, context.weather)
  const controlledMismatch = distance >= 1 && distance <= 2 && weatherScore >= 62 && comfortLevel(shoe) >= 3
  const score = clampScore(controlledMismatch ? 84 : distance > 2 || weatherScore < 52 ? 36 : 62)

  return {
    key: 'wrongShoeTheory',
    score,
    explanation: controlledMismatch ? '错鞋理论成立：鞋履和主体有可控错位，但没有牺牲天气或舒适底线。' : '错鞋理论不成立：鞋履要么太安全，要么错位过大。'
  }
}

function scoreTwoThirdRule(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const items = selectedItems(outfit)
  const easyItems = items.filter((item) => comfortLevel(item) >= 4 || hasToken(itemText(item), ['基础', '免烫', '套装', '连衣裙'])).length
  const polishedAnchor = items.some((item) => formalityLevel(item) >= 4 || isBagCategory(item.category) || isAccessoryCategory(item.category))
  const lowEffortBonus = context.effortLevel === 'low' ? 10 : 0
  const score = clampScore(46 + easyItems * 10 + (polishedAnchor ? 18 : 0) + lowEffortBonus - Math.max(0, items.length - 5) * 8)

  return {
    key: 'twoThirdRule',
    score,
    explanation: score >= 72 ? '2/3 低压力精致感成立：简单好穿，同时有一个完成度锚点。' : '2/3 规则偏弱：准备成本或精致锚点不够理想。'
  }
}

function scoreProportionBalance(outfit: EvaluatedOutfit): StrategyScoreResult {
  const text = outfitText(outfit)
  const topText = outfit.top ? itemText(outfit.top) : ''
  const bottomText = outfit.bottom ? itemText(outfit.bottom) : ''
  const matched =
    Boolean(outfit.dress) ||
    (hasToken(topText, ['短', 'cropped']) && hasToken(bottomText, ['高腰', '长'])) ||
    (hasToken(topText, ['宽松', 'oversized']) && hasToken(bottomText, ['直筒', '修身', '窄'])) ||
    hasToken(text, ['上短下长', '高腰线', '收腰', '内短外长'])
  const visualWeights = selectedItems(outfit).filter((item) => !isAccessoryCategory(item.category)).map(visualWeight)
  const spread = visualWeights.length ? Math.max(...visualWeights) - Math.min(...visualWeights) : 0
  const score = clampScore((matched ? 78 : 58) + (spread <= 2 ? 10 : -spread * 5))

  return {
    key: 'proportionBalance',
    score,
    explanation: matched ? '比例平衡成立：轮廓里有明确的收束点或上下比例关系。' : '比例平衡一般：当前轮廓缺少明确收束点。'
  }
}

function scoreLayering(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const hasOuter = Boolean(outfit.outerLayer)
  const text = outfitText(outfit)
  const hasLayerRole = selectedItems(outfit).some((item) => ['mid', 'outer'].includes(item.algorithmMeta?.layerRole ?? ''))
  let score = hasOuter || hasLayerRole ? 76 : 62

  if (context.weather?.isCold) {
    score += hasOuter ? 16 : -28
  } else if (context.weather?.isWarm) {
    score += hasOuter ? -18 : 10
  }

  if (hasToken(text, ['领口冲突', '袖长冲突', '太厚'])) {
    score -= 18
  }

  return {
    key: 'layering',
    score: clampScore(score),
    explanation: score >= 72 ? '层次策略成立：叠穿服务温差和轮廓，而不是无目的加层。' : '层次策略偏弱：天气或层次兼容性不够。'
  }
}

function scoreTonalDressing(outfit: EvaluatedOutfit): StrategyScoreResult {
  const colors = selectedItems(outfit).map((item) => item.colorCategory)
  let tonalPairs = 0

  colors.forEach((color, index) => {
    tonalPairs += colors.slice(index + 1).filter((next) => hasTonalColorRelationship(color, next)).length
  })

  const clusters = new Set(colors.map(getColorCluster).filter((cluster) => cluster !== 'unknown'))
  const score = clampScore(tonalPairs > 0 ? 78 + Math.min(14, tonalPairs * 4) : clusters.size <= 2 && colors.length >= 2 ? 68 : 44)

  return {
    key: 'tonalDressing',
    score,
    explanation: score >= 72 ? '同色系策略成立：颜色有同簇关系，并保留明度或材质层次。' : '同色系策略不明显：颜色关系更偏普通组合。'
  }
}

function scoreOccasionNiche(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const profile = getProfile(context)
  const scores = selectedItems(outfit).map((item) => getItemSceneFit(item, {
    profile,
    weather: context.weather,
    travelScenes: context.travelScenes
  }))
  const score = clampScore(average(scores, 62))

  return {
    key: 'occasionNiche',
    score,
    explanation: score >= 72 ? '场景垂直策略成立：单品语言能承接当前场景。' : '场景垂直策略偏弱：正式度、舒适度或场景标签不够集中。'
  }
}

function scorePinterestRecreation(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const inspirationTags = context.inspirationTags ?? []
  const tags = selectedItems(outfit).flatMap((item) => item.styleTags.map(normalizeInput))
  const matched = inspirationTags.map(normalizeInput).filter((tag) => tags.includes(tag)).length
  const slotCoverage = [outfit.dress || (outfit.top && outfit.bottom), outfit.shoes, outfit.bag || (outfit.accessories ?? []).length > 0]
    .filter(Boolean).length
  const score = clampScore(inspirationTags.length > 0 ? 50 + matched * 16 + slotCoverage * 8 : 54 + slotCoverage * 10)

  return {
    key: 'pinterestRecreation',
    score,
    explanation: score >= 72 ? 'Pinterest 复刻策略成立：风格标签和关键 slot 能保住灵感公式。' : 'Pinterest 复刻策略一般：灵感图公式需要更多替代单品支撑。'
  }
}

function scoreTrendOverlay(outfit: EvaluatedOutfit, context: RecommendationScoringContext): StrategyScoreResult {
  const trendSignals = context.trendSignals && context.trendSignals.length > 0 ? context.trendSignals : DEFAULT_RECOMMENDATION_TRENDS
  const trendTags = [...getTrendSearchTags(trendSignals), ...(context.trendTags ?? [])]
  const text = outfitText(outfit)
  const matched = trendTags.filter((tag) => hasToken(text, [tag])).length
  const matchedSignalWeight = trendSignals
    .filter((signal) => [signal.tag, ...signal.aliases].some((tag) => hasToken(text, [tag])))
    .reduce((sum, signal) => sum + signal.activeWeight, 0)
  const profile = getProfile(context)
  const sensitivity = profile.exploration.rate >= 0.08 ? 1.2 : profile.exploration.rate <= 0.02 ? 0.55 : 1
  const score = clampScore(48 + matched * 9 * sensitivity + matchedSignalWeight * 11 * sensitivity)

  return {
    key: 'trendOverlay',
    score,
    explanation: score >= 72 ? '趋势覆盖层成立：有轻量趋势标签，但仍作为低权重加分。' : '趋势覆盖层较低：这套主要靠稳定穿搭逻辑，不靠趋势。'
  }
}

export function scoreRecommendationStrategies(
  outfit: EvaluatedOutfit,
  context: RecommendationScoringContext = {}
) {
  const results: StrategyScoreResult[] = [
    scoreCapsuleWardrobe(outfit),
    scoreOutfitFormula(outfit),
    scoreThreeWordStyle(outfit, context),
    scorePersonalColorPalette(outfit, context),
    scoreSandwichDressing(outfit),
    scoreWrongShoeTheory(outfit, context),
    scoreTwoThirdRule(outfit, context),
    scoreProportionBalance(outfit),
    scoreLayering(outfit, context),
    scoreTonalDressing(outfit),
    scoreOccasionNiche(outfit, context),
    scorePinterestRecreation(outfit, context),
    scoreTrendOverlay(outfit, context)
  ]
  const scoreMap = Object.fromEntries(results.map((result) => [result.key, result.score])) as RecommendationStrategyScores

  for (const key of RECOMMENDATION_STRATEGY_KEYS) {
    scoreMap[key] ??= 0
  }

  return { results, scoreMap }
}
