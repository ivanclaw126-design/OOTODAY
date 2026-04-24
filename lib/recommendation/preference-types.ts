export const SCORE_WEIGHT_KEYS = [
  'colorHarmony',
  'silhouetteBalance',
  'layering',
  'focalPoint',
  'sceneFit',
  'weatherComfort',
  'completeness',
  'freshness'
] as const

export type ScoreWeightKey = (typeof SCORE_WEIGHT_KEYS)[number]

export type ScoreWeights = Record<ScoreWeightKey, number>

export type PreferenceSource = 'default' | 'questionnaire' | 'adaptive'

export type PreferredScene = 'work' | 'casual' | 'date' | 'travel' | 'outdoor' | 'party'

export type SilhouettePreference =
  | 'shortTopHighWaist'
  | 'looseTopSlimBottom'
  | 'fittedTopWideBottom'
  | 'relaxedAll'
  | 'onePiece'

export type ColorPalettePreference = 'neutral' | 'tonal' | 'softColor' | 'oneAccent' | 'boldContrast'

export type PreferenceProfile = {
  preferredScenes: PreferredScene[]
  silhouettePreference: SilhouettePreference[]
  colorPreference: {
    saturation: 'low' | 'medium' | 'high'
    contrast: 'low' | 'medium' | 'high'
    palette: ColorPalettePreference
    accentTolerance: 0 | 1 | 2
  }
  layeringPreference: {
    complexity: 0 | 1 | 2 | 3
    allowNonWeatherOuterwear: boolean
  }
  focalPointPreference: 'upperBody' | 'waist' | 'shoes' | 'bagAccessory' | 'subtle'
  practicalityPreference: {
    comfortPriority: 0 | 1 | 2 | 3
    stylePriority: 0 | 1 | 2 | 3
  }
  slotPreference: {
    outerwear: boolean
    shoes: boolean
    bag: boolean
    accessories: boolean
  }
  exploration: {
    enabled: boolean
    rate: number
    maxDistanceFromDailyStyle: number
  }
  hardAvoids: string[]
}

export type RecommendationPreferenceState = {
  version: number
  source: PreferenceSource
  defaultWeights: ScoreWeights
  questionnaireDelta: Partial<ScoreWeights>
  ratingDelta: Partial<ScoreWeights>
  finalWeights: ScoreWeights
  profile: PreferenceProfile
  createdAt: string
  updatedAt: string
}

export type QuestionnaireLayeringComplexity = 'simple' | 'lightLayer' | 'threeLayer' | 'textureMix'

export type QuestionnairePracticality =
  | 'comfort'
  | 'balanced'
  | 'style'
  | 'weekdayComfortWeekendStyle'

export type QuestionnaireExploration = 'stable' | 'slight' | 'inspiration' | 'bold'

export type StyleQuestionnaireAnswers = {
  scenes: Array<Exclude<PreferredScene, 'party'>>
  silhouettes: SilhouettePreference[]
  colorPalette: ColorPalettePreference
  layeringComplexity: QuestionnaireLayeringComplexity
  focalPoint: PreferenceProfile['focalPointPreference']
  practicality: QuestionnairePracticality
  slots: Partial<PreferenceProfile['slotPreference']>
  exploration: QuestionnaireExploration
  hardAvoids: string[]
}

export const TODAY_FEEDBACK_REASON_TAGS = [
  'like_color',
  'like_silhouette',
  'like_layering',
  'like_shoes_bag',
  'like_scene_fit',
  'like_comfort',
  'like_freshness',
  'dislike_color',
  'dislike_silhouette',
  'dislike_too_complex',
  'dislike_too_plain',
  'dislike_too_bold',
  'dislike_shoes',
  'dislike_scene_fit',
  'dislike_comfort',
  'dislike_item'
] as const

export type TodayFeedbackReasonTag = (typeof TODAY_FEEDBACK_REASON_TAGS)[number]

export type InspirationCandidateSignals = {
  id: string
  styleTags?: string[]
  hardAvoidTags?: string[]
  colorHarmony?: number
  focalPointCount?: number
  sceneFit?: number
  weatherComfort?: number
  distanceFromDailyStyle?: number
  isFormalScene?: boolean
  isSevereWeather?: boolean
}
