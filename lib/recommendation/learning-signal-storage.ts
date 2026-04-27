import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  normalizeLearningSignalRows,
  type RecommendationLearningSignal,
  type RecommendationLearningSignalRow
} from '@/lib/recommendation/learning-signals'
import type { RecommendationSurface } from '@/lib/recommendation/canonical-types'
import type { Json } from '@/types/database'

type LearningSignalClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

export async function getRecommendationLearningSignals({
  userId,
  surface,
  supabase
}: {
  userId: string
  surface: RecommendationSurface
  supabase?: LearningSignalClient
}): Promise<RecommendationLearningSignal[]> {
  try {
    const client = supabase ?? await createSupabaseServerClient()
    const { data, error } = await client
      .from('recommendation_learning_signals')
      .select('signal_type, entity_key, related_entity_key, context_key, value, weight, source_event_type')
      .eq('user_id', userId)
      .eq('surface', surface)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      throw error
    }

    return normalizeLearningSignalRows(data as RecommendationLearningSignalRow[] | null)
  } catch {
    return []
  }
}

export async function recordRecommendationLearningSignals({
  userId,
  surface,
  signals,
  metadata = {},
  supabase
}: {
  userId: string
  surface: RecommendationSurface
  signals: RecommendationLearningSignal[]
  metadata?: Record<string, unknown>
  supabase?: LearningSignalClient
}) {
  const boundedSignals = signals
    .filter((signal) => signal.entityKey.trim())
    .slice(0, 60)

  if (boundedSignals.length === 0) {
    return
  }

  try {
    const client = supabase ?? await createSupabaseServerClient()
    await client.from('recommendation_learning_signals').insert(boundedSignals.map((signal) => ({
      user_id: userId,
      surface,
      signal_type: signal.type,
      entity_key: signal.entityKey,
      related_entity_key: signal.relatedEntityKey ?? null,
      context_key: signal.contextKey ?? null,
      value: Math.max(-1, Math.min(1, signal.value)),
      weight: Math.max(0, Math.min(3, signal.weight)),
      source_event_type: signal.sourceEventType ?? null,
      metadata: toJson(metadata)
    })))
  } catch {
    // Recommendation learning signals are opportunistic and must not block product flows.
  }
}
