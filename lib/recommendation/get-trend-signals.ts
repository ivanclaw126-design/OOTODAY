import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  DEFAULT_RECOMMENDATION_TRENDS,
  normalizeRecommendationTrendRows,
  type RecommendationTrendRow,
  type RecommendationTrendSignal
} from '@/lib/recommendation/trends'

type TrendSignalClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function getRecommendationTrendSignals({
  supabase,
  now = new Date()
}: {
  supabase?: TrendSignalClient
  now?: Date
} = {}): Promise<RecommendationTrendSignal[]> {
  try {
    const client = supabase ?? await createSupabaseServerClient()
    const today = now.toISOString().slice(0, 10)
    const { data, error } = await client
      .from('recommendation_trends')
      .select('tag, source, aliases, start_date, end_date, weight, decay_rate, applicable_scenes, applicable_styles, status')
      .eq('status', 'active')
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('weight', { ascending: false })
      .limit(80)

    if (error) {
      throw error
    }

    return normalizeRecommendationTrendRows(data as RecommendationTrendRow[] | null, now)
  } catch {
    return DEFAULT_RECOMMENDATION_TRENDS
  }
}
