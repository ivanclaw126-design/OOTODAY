import { deserializePreferenceState } from '@/lib/recommendation/preference-state-storage'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'
import { resolveRecommendationSupabaseClient, type RecommendationSupabaseClientLike } from '@/lib/recommendation/recommendation-supabase'

export async function getPreferenceState({
  userId,
  now = new Date(),
  supabase
}: {
  userId: string
  now?: Date
  supabase?: RecommendationSupabaseClientLike
}) {
  const client = await resolveRecommendationSupabaseClient(supabase)
  const { data, error } = await client
    .from('recommendation_preferences')
    .select('user_id, version, source, default_weights, questionnaire_delta, rating_delta, final_weights, profile, questionnaire_answers, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return resetRecommendationPreferences(now)
  }

  return deserializePreferenceState(data)
}
