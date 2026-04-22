import { createSupabaseServerClient } from '@/lib/supabase/server'
import { decodeTravelScenarioMetadata, isTravelPlansTableMissing } from '@/lib/travel/persistence'
import type { TravelSavedPlan, TravelScene } from '@/lib/travel/types'

export async function getRecentTravelPlans(userId: string): Promise<TravelSavedPlan[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('travel_plans')
    .select('id, title, destination_city, days, scenes, weather_summary, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!error) {
    return (data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      destinationCity: item.destination_city,
      days: item.days,
      scenes: (item.scenes ?? []) as TravelScene[],
      weatherSummary: item.weather_summary,
      createdAt: item.created_at,
      source: 'travel_plans'
    }))
  }

  if (!isTravelPlansTableMissing(error)) {
    throw error
  }

  const fallback = await supabase
    .from('outfits')
    .select('id, title, scenario, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (fallback.error) {
    throw fallback.error
  }

  return (fallback.data ?? [])
    .map((item) =>
      decodeTravelScenarioMetadata(item.scenario, {
        id: item.id,
        title: item.title,
        createdAt: item.created_at
      })
    )
    .filter((item): item is TravelSavedPlan => item !== null)
    .slice(0, 5)
}
