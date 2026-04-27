import type { EvaluatedOutfit } from '@/lib/recommendation/outfit-evaluator'
import type { RecommendationLearningSignal } from '@/lib/recommendation/learning-signals'
import type { RecommendationTrendSignal } from '@/lib/recommendation/trends'
import type { PreferenceProfile, ScoreWeights } from '@/lib/recommendation/preference-types'
import type { TodayWeather } from '@/lib/today/types'

export type RecommendationSurface = 'today' | 'shop' | 'inspiration' | 'travel'

export const RECOMMENDATION_STRATEGY_KEYS = [
  'capsuleWardrobe',
  'outfitFormula',
  'threeWordStyle',
  'personalColorPalette',
  'sandwichDressing',
  'wrongShoeTheory',
  'twoThirdRule',
  'proportionBalance',
  'layering',
  'tonalDressing',
  'occasionNiche',
  'pinterestRecreation',
  'trendOverlay'
] as const

export type RecommendationStrategyKey = (typeof RECOMMENDATION_STRATEGY_KEYS)[number]

export type RecommendationStrategyScores = Record<RecommendationStrategyKey, number>

export type RecommendationRuleScores = {
  contextFit: number
  visualCompatibility: number
  userPreference: number
  outfitStrategy: number
  weatherPracticality: number
  novelty: number
  wardrobeRotation: number
  trendOverlay: number
  explanationQuality: number
}

export type RecommendationCompatibilityScores = {
  color: number
  silhouette: number
  material: number
  formality: number
  styleDistance: number
  pattern: number
  shoesBag: number
  temperature: number
  scene: number
}

export type RecommendationPenalty = {
  key: string
  value: number
  reason: string
}

export type RecommendationModelScores = {
  modelRunId: string | null
  xgboostScore: number | null
  lightfmScore: number | null
  implicitScore: number | null
  ruleScore: number | null
  finalScore: number | null
  status: 'active' | 'missing' | 'expired' | 'low_quality'
}

export type RecommendationScoreBreakdown = {
  totalScore: number
  ruleBaselineScore: number
  modelScores: RecommendationModelScores
  ruleScores: RecommendationRuleScores
  compatibilityScores: RecommendationCompatibilityScores
  strategyScores: RecommendationStrategyScores
  primaryStrategy?: RecommendationStrategyKey | null
  strategySummaryKeys?: RecommendationStrategyKey[]
  componentScores: ScoreWeights
  penalties: RecommendationPenalty[]
  explanation: string[]
  riskFlags: string[]
}

export type RecommendationCandidate = {
  id: string
  surface: RecommendationSurface
  outfit: EvaluatedOutfit
  context?: RecommendationScoringContext
}

export type RecommendationScoringContext = {
  surface?: RecommendationSurface
  weather?: TodayWeather | null
  profile?: PreferenceProfile | null
  scenes?: string[]
  travelScenes?: string[]
  trendTags?: string[]
  trendSignals?: RecommendationTrendSignal[]
  inspirationTags?: string[]
  learningSignals?: RecommendationLearningSignal[]
  formulaId?: string | null
  recallSource?: 'formula' | 'rule' | 'weather' | 'exploration' | 'model_seed'
  effortLevel?: 'low' | 'medium' | 'high'
}

export type RecommendationResult = RecommendationCandidate & {
  scoreBreakdown: RecommendationScoreBreakdown
}

export type RecommendationInteractionEventType =
  | 'exposed'
  | 'opened'
  | 'skipped'
  | 'saved'
  | 'worn'
  | 'rated_good'
  | 'repeated'
  | 'replaced_item'
  | 'disliked'
  | 'hidden_item'

export const RECOMMENDATION_RULE_WEIGHTS: RecommendationRuleScores = {
  contextFit: 0.2,
  visualCompatibility: 0.18,
  userPreference: 0.16,
  outfitStrategy: 0.12,
  weatherPracticality: 0.1,
  novelty: 0.08,
  wardrobeRotation: 0.06,
  trendOverlay: 0.05,
  explanationQuality: 0.03
}

export const EMPTY_MODEL_SCORES: RecommendationModelScores = {
  modelRunId: null,
  xgboostScore: null,
  lightfmScore: null,
  implicitScore: null,
  ruleScore: null,
  finalScore: null,
  status: 'missing'
}
