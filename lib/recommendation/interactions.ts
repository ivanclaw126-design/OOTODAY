import type {
  RecommendationInteractionEventType,
  RecommendationScoreBreakdown,
  RecommendationSurface
} from '@/lib/recommendation/canonical-types'
import { buildInteractionLearningSignals } from '@/lib/recommendation/learning-signals'
import { recordRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

export function getRecommendationInteractionValue(eventType: RecommendationInteractionEventType, rating?: number | null) {
  if (eventType === 'exposed') {
    return 0
  }

  if (eventType === 'opened') {
    return 0.1
  }

  if (eventType === 'skipped') {
    return -0.05
  }

  if (eventType === 'saved') {
    return 0.6
  }

  if (eventType === 'worn') {
    return 1
  }

  if (eventType === 'rated_good') {
    return rating && rating >= 4 ? 1.5 : 0.4
  }

  if (eventType === 'repeated') {
    return 1.2
  }

  if (eventType === 'replaced_item') {
    return -0.3
  }

  if (eventType === 'disliked') {
    return -1
  }

  return -2
}

export async function recordRecommendationInteraction({
  userId,
  surface,
  eventType,
  recommendationId = null,
  candidateId = recommendationId,
  itemIds = [],
  context = {},
  scoreBreakdown = null,
  rating = null
}: {
  userId: string
  surface: RecommendationSurface
  eventType: RecommendationInteractionEventType
  recommendationId?: string | null
  candidateId?: string | null
  itemIds?: string[]
  context?: Record<string, unknown>
  scoreBreakdown?: RecommendationScoreBreakdown | null
  rating?: number | null
}) {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.from('recommendation_interactions').insert({
      user_id: userId,
      surface,
      event_type: eventType,
      event_value: getRecommendationInteractionValue(eventType, rating),
      recommendation_id: recommendationId,
      candidate_id: candidateId,
      item_ids: itemIds,
      context: toJson(context),
      score_breakdown: scoreBreakdown ? toJson(scoreBreakdown) : null,
      model_run_id: scoreBreakdown?.modelScores.modelRunId ?? null
    })
    await recordRecommendationLearningSignals({
      userId,
      surface,
      signals: buildInteractionLearningSignals({
        surface,
        eventType,
        itemIds,
        contextKey: typeof context.contextKey === 'string' ? context.contextKey : surface,
        rating
      }),
      metadata: {
        recommendationId,
        candidateId
      },
      supabase
    })
  } catch {
    // Recommendation learning events must not block user flows.
  }
}
