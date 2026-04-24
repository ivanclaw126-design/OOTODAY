import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { RecommendationPreferenceRow } from '@/lib/recommendation/preference-state-storage'

export type SupabaseErrorLike = {
  code?: string
  message?: string
}

export type SupabaseResult<TData> = Promise<{
  data: TData
  error: SupabaseErrorLike | null
}>

export type RecommendationPreferencesTableLike = {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): SupabaseResult<RecommendationPreferenceRow | null>
    }
  }
  upsert(payload: unknown, options?: { onConflict?: string }): SupabaseResult<unknown>
}

export type OutfitFeedbackEventsTableLike = {
  insert(payload: unknown): SupabaseResult<unknown>
}

export type RecommendationSupabaseClientLike = {
  from(table: 'recommendation_preferences'): RecommendationPreferencesTableLike
  from(table: 'outfit_feedback_events'): OutfitFeedbackEventsTableLike
}

export async function resolveRecommendationSupabaseClient(supabase?: RecommendationSupabaseClientLike) {
  return supabase ?? (await createSupabaseServerClient() as unknown as RecommendationSupabaseClientLike)
}
