import type { ClosetItemCardData } from '@/lib/closet/types'
import type { ScoreWeights, TodayFeedbackReasonTag } from '@/lib/recommendation/preference-types'

export type TodayWeather = {
  city: string
  temperatureC: number
  conditionLabel: string
  isWarm: boolean
  isCold: boolean
}

export type TodayWeatherState =
  | { status: 'not-set' }
  | { status: 'ready'; weather: TodayWeather }
  | { status: 'unavailable'; city: string }

export type TodayRecommendationItem = Pick<
  ClosetItemCardData,
  'id' | 'imageUrl' | 'category' | 'subCategory' | 'colorCategory' | 'styleTags'
>

export type TodayRecommendation = {
  id: string
  reason: string
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

export type TodayView = {
  itemCount: number
  city: string | null
  accountEmail: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  hasCompletedStyleQuestionnaire?: boolean
  weatherState: TodayWeatherState
  recommendations: TodayRecommendation[]
  recommendationError: boolean
  ootdStatus: TodayOotdStatus
  recentOotdHistory: TodayOotdHistoryEntry[]
}
