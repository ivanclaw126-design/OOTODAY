import { buildWeightsAfterFeedback } from '@/lib/recommendation/feedback-learning'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { savePreferenceState } from '@/lib/recommendation/save-preference-state'
import { buildFeedbackLearningSignals } from '@/lib/recommendation/learning-signals'
import { recordRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { resolveRecommendationSupabaseClient, type RecommendationSupabaseClientLike } from '@/lib/recommendation/recommendation-supabase'
import type { ScoreWeights, TodayFeedbackReasonTag } from '@/lib/recommendation/preference-types'
import type { Json } from '@/types/database'

function toJsonOrNull(value: unknown | null | undefined): Json | null {
  if (value === null || value === undefined) {
    return null
  }

  return JSON.parse(JSON.stringify(value)) as Json
}

function toRecommendationSurface(context: string) {
  return context === 'shop' || context === 'inspiration' || context === 'travel' ? context : 'today'
}

export async function applyFeedback({
  userId,
  rating,
  reasonTags,
  recommendationId = null,
  recommendationSnapshot = null,
  componentScores = null,
  context = 'today',
  now = new Date(),
  supabase
}: {
  userId: string
  rating: number
  reasonTags: TodayFeedbackReasonTag[]
  recommendationId?: string | null
  recommendationSnapshot?: unknown | null
  componentScores?: Partial<ScoreWeights> | null
  context?: string
  now?: Date
  supabase?: RecommendationSupabaseClientLike
}) {
  const client = await resolveRecommendationSupabaseClient(supabase)
  const currentState = await getPreferenceState({ userId, now, supabase: client })
  const { ratingDelta, finalWeights } = buildWeightsAfterFeedback({
    defaultWeights: currentState.defaultWeights,
    questionnaireDelta: currentState.questionnaireDelta,
    currentRatingDelta: currentState.ratingDelta,
    rating,
    reasonTags
  })
  const createdAt = now.toISOString()

  const feedbackInsert = await client.from('outfit_feedback_events').insert({
    user_id: userId,
    recommendation_id: recommendationId,
    preference_version: currentState.version,
    context,
    rating,
    reason_tags: [...new Set(reasonTags)],
    recommendation_snapshot: toJsonOrNull(recommendationSnapshot),
    component_scores: toJsonOrNull(componentScores),
    created_at: createdAt
  })

  if (feedbackInsert.error) {
    throw feedbackInsert.error
  }

  const nextState = {
    ...currentState,
    source: 'adaptive' as const,
    hasQuestionnaireAnswers: currentState.hasQuestionnaireAnswers,
    ratingDelta,
    finalWeights,
    updatedAt: createdAt
  }

  await savePreferenceState({
    userId,
    state: nextState,
    questionnaireAnswers: currentState.questionnaireAnswers,
    supabase: client
  })

  await recordRecommendationLearningSignals({
    userId,
    surface: toRecommendationSurface(context),
    signals: buildFeedbackLearningSignals({
      recommendationSnapshot,
      rating,
      reasonTags,
      contextKey: context
    }),
    metadata: {
      recommendationId,
      preferenceVersion: currentState.version
    }
  })

  return nextState
}
