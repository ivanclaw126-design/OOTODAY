import type { Json } from '@/types/database'
import { buildFinalWeights } from '@/lib/recommendation/build-final-weights'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { SCORE_WEIGHT_KEYS, type PreferenceProfile, type PreferenceSource, type RecommendationPreferenceState, type ScoreWeights } from '@/lib/recommendation/preference-types'
import { clonePreferenceProfile, cloneScoreWeights } from '@/lib/recommendation/reset-preferences'

export type RecommendationPreferenceRow = {
  user_id: string
  version: number
  source: PreferenceSource
  default_weights: unknown
  questionnaire_delta: unknown
  rating_delta: unknown
  final_weights: unknown
  profile: unknown
  questionnaire_answers: unknown | null
  created_at: string
  updated_at: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function coerceScoreWeights(value: unknown, fallback: ScoreWeights): ScoreWeights {
  if (!isObject(value)) {
    return cloneScoreWeights(fallback)
  }

  const next = cloneScoreWeights(fallback)

  SCORE_WEIGHT_KEYS.forEach((key) => {
    const candidate = value[key]

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      next[key] = candidate
    }
  })

  return next
}

function coercePartialScoreWeights(value: unknown): Partial<ScoreWeights> {
  if (!isObject(value)) {
    return {}
  }

  const next: Partial<ScoreWeights> = {}

  SCORE_WEIGHT_KEYS.forEach((key) => {
    const candidate = value[key]

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      next[key] = candidate
    }
  })

  return next
}

function coercePreferenceProfile(value: unknown): PreferenceProfile {
  const fallback = clonePreferenceProfile(DEFAULT_PREFERENCE_PROFILE)

  if (!isObject(value)) {
    return fallback
  }

  return {
    ...fallback,
    preferredScenes: Array.isArray(value.preferredScenes) ? value.preferredScenes.filter((item): item is PreferenceProfile['preferredScenes'][number] => typeof item === 'string') : fallback.preferredScenes,
    silhouettePreference: Array.isArray(value.silhouettePreference) ? value.silhouettePreference.filter((item): item is PreferenceProfile['silhouettePreference'][number] => typeof item === 'string') : fallback.silhouettePreference,
    colorPreference: isObject(value.colorPreference)
      ? { ...fallback.colorPreference, ...value.colorPreference }
      : fallback.colorPreference,
    layeringPreference: isObject(value.layeringPreference)
      ? { ...fallback.layeringPreference, ...value.layeringPreference }
      : fallback.layeringPreference,
    focalPointPreference: typeof value.focalPointPreference === 'string'
      ? value.focalPointPreference as PreferenceProfile['focalPointPreference']
      : fallback.focalPointPreference,
    practicalityPreference: isObject(value.practicalityPreference)
      ? { ...fallback.practicalityPreference, ...value.practicalityPreference }
      : fallback.practicalityPreference,
    slotPreference: isObject(value.slotPreference)
      ? { ...fallback.slotPreference, ...value.slotPreference }
      : fallback.slotPreference,
    exploration: isObject(value.exploration)
      ? { ...fallback.exploration, ...value.exploration }
      : fallback.exploration,
    hardAvoids: Array.isArray(value.hardAvoids) ? value.hardAvoids.filter((item): item is string => typeof item === 'string') : []
  }
}

export function deserializePreferenceState(row: RecommendationPreferenceRow): RecommendationPreferenceState {
  const defaultWeights = coerceScoreWeights(row.default_weights, DEFAULT_RECOMMENDATION_WEIGHTS)
  const questionnaireDelta = coercePartialScoreWeights(row.questionnaire_delta)
  const ratingDelta = coercePartialScoreWeights(row.rating_delta)
  const finalWeights = coerceScoreWeights(
    row.final_weights,
    buildFinalWeights(defaultWeights, questionnaireDelta, ratingDelta)
  )

  return {
    version: row.version,
    source: row.source,
    hasQuestionnaireAnswers: row.questionnaire_answers !== null && row.questionnaire_answers !== undefined,
    questionnaireAnswers: row.questionnaire_answers ?? null,
    defaultWeights,
    questionnaireDelta,
    ratingDelta,
    finalWeights,
    profile: coercePreferenceProfile(row.profile),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function serializePreferenceState({
  userId,
  state,
  questionnaireAnswers
}: {
  userId: string
  state: RecommendationPreferenceState
  questionnaireAnswers?: unknown | null
}) {
  const nextQuestionnaireAnswers = questionnaireAnswers === undefined ? state.questionnaireAnswers : questionnaireAnswers

  return {
    user_id: userId,
    version: state.version,
    source: state.source,
    default_weights: toJson(state.defaultWeights),
    questionnaire_delta: toJson(state.questionnaireDelta),
    rating_delta: toJson(state.ratingDelta),
    final_weights: toJson(state.finalWeights),
    profile: toJson(state.profile),
    questionnaire_answers: nextQuestionnaireAnswers === null || nextQuestionnaireAnswers === undefined ? null : toJson(nextQuestionnaireAnswers),
    created_at: state.createdAt,
    updated_at: state.updatedAt
  }
}
