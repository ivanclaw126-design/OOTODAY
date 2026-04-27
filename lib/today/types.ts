import type { ClosetItemCardData } from '@/lib/closet/types'
import type { RecommendationModelScores, RecommendationScoreBreakdown, RecommendationStrategyKey } from '@/lib/recommendation/canonical-types'
import type { PreferredScene, ScoreWeights, TodayFeedbackReasonTag } from '@/lib/recommendation/preference-types'

export const TODAY_TARGET_DATES = ['today', 'tomorrow'] as const
export type TodayTargetDate = (typeof TODAY_TARGET_DATES)[number]

export const TODAY_CONTEXT_SCENES = ['work', 'casual', 'date', 'travel', 'outdoor'] as const satisfies readonly PreferredScene[]
export type TodayScene = (typeof TODAY_CONTEXT_SCENES)[number] | null

export type TodayWeather = {
  city: string
  temperatureC: number
  conditionLabel: string
  isWarm: boolean
  isCold: boolean
  targetDate?: TodayTargetDate
  sourceLabel?: string
}

export type TodayWeatherState =
  | { status: 'not-set'; targetDate?: TodayTargetDate }
  | { status: 'ready'; weather: TodayWeather; targetDate?: TodayTargetDate }
  | { status: 'unavailable'; city: string; targetDate?: TodayTargetDate }

export type TodayRecommendationItem = Pick<
  ClosetItemCardData,
  'id' | 'imageUrl' | 'category' | 'subCategory' | 'colorCategory' | 'styleTags'
>

export type TodayRecommendation = {
  id: string
  reason: string
  reasonHighlights?: string[]
  top: TodayRecommendationItem | null
  bottom: TodayRecommendationItem | null
  dress: TodayRecommendationItem | null
  outerLayer: TodayRecommendationItem | null
  shoes: TodayRecommendationItem | null
  bag: TodayRecommendationItem | null
  accessories: TodayRecommendationItem[]
  missingSlots: TodayRecommendationMissingSlot[]
  confidence: number
  componentScores: ScoreWeights
  totalScore?: number
  scoreBreakdown?: RecommendationScoreBreakdown
  primaryStrategy?: RecommendationStrategyKey | null
  modelScores?: RecommendationModelScores
  modelRunId?: string | null
  formulaId?: string | null
  recallSource?: 'formula' | 'rule' | 'weather' | 'exploration' | 'model_seed'
  targetDate?: TodayTargetDate
  scene?: TodayScene
  mode: TodayRecommendationMode
  inspirationReason?: string | null
  dailyDifference?: string | null
}

export type TodayRecommendationMissingSlot = 'top' | 'bottom' | 'dress' | 'outerLayer' | 'shoes' | 'bag' | 'accessories'

export type TodayRecommendationMode = 'daily' | 'inspiration'

export type { TodayFeedbackReasonTag }

export type TodayOotdFeedbackInput = {
  recommendation: TodayRecommendation
  satisfactionScore: number
  reasonTags: TodayFeedbackReasonTag[]
}

export type TodayOotdStatus =
  | { status: 'not-recorded' }
  | { status: 'recorded'; wornAt: string }

export type TodayOotdHistoryEntry = {
  id: string
  wornAt: string
  satisfactionScore: number | null
  notes: string | null
}

export type TodayHistoryUpdateInput = {
  ootdId: string
  satisfactionScore: number | null
  notes: string
}

export type TodayRecommendationRefreshInput = {
  offset: number
  targetDate?: TodayTargetDate
  scene?: TodayScene
}

export type TodayRecommendationRefreshResult = {
  recommendations: TodayRecommendation[]
  weatherState: TodayWeatherState
}

export type TodayView = {
  itemCount: number
  city: string | null
  accountEmail: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  hasCompletedStyleQuestionnaire?: boolean
  targetDate?: TodayTargetDate
  scene?: TodayScene
  weatherState: TodayWeatherState
  recommendations: TodayRecommendation[]
  recommendationError: boolean
  ootdStatus: TodayOotdStatus
  recentOotdHistory: TodayOotdHistoryEntry[]
}
