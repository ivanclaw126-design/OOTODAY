import type { RecommendationPreferenceState } from '@/lib/recommendation/preference-types'
import { serializePreferenceState } from '@/lib/recommendation/preference-state-storage'
import { resolveRecommendationSupabaseClient, type RecommendationSupabaseClientLike } from '@/lib/recommendation/recommendation-supabase'

export async function savePreferenceState({
  userId,
  state,
  questionnaireAnswers,
  supabase
}: {
  userId: string
  state: RecommendationPreferenceState
  questionnaireAnswers?: unknown | null
  supabase?: RecommendationSupabaseClientLike
}) {
  const client = await resolveRecommendationSupabaseClient(supabase)
  const { error } = await client
    .from('recommendation_preferences')
    .upsert(serializePreferenceState({ userId, state, questionnaireAnswers }), { onConflict: 'user_id' })

  if (error) {
    throw error
  }

  return state
}
