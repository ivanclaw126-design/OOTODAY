import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  buildTravelSavedPlanSnapshotFromRow,
  decodeTravelScenarioSnapshot,
  isTravelPlansTableMissing
} from '@/lib/travel/persistence'
import type { TravelPackingPlan, TravelSavedPlanSnapshot, TravelScene } from '@/lib/travel/types'

export async function getTravelPlanById(userId: string, planId: string): Promise<TravelSavedPlanSnapshot | null> {
  const supabase = await createSupabaseServerClient()

  const travelPlansResult = await supabase
    .from('travel_plans')
    .select('id, title, destination_city, days, scenes, weather_summary, created_at, plan_json')
    .eq('user_id', userId)
    .eq('id', planId)
    .maybeSingle()

  if (!travelPlansResult.error && travelPlansResult.data) {
    return buildTravelSavedPlanSnapshotFromRow({
      id: travelPlansResult.data.id,
      title: travelPlansResult.data.title,
      destinationCity: travelPlansResult.data.destination_city,
      days: travelPlansResult.data.days,
      scenes: (travelPlansResult.data.scenes ?? []) as TravelScene[],
      weatherSummary: travelPlansResult.data.weather_summary,
      createdAt: travelPlansResult.data.created_at,
      source: 'travel_plans',
      plan: travelPlansResult.data.plan_json as TravelPackingPlan
    })
  }

  if (travelPlansResult.error && !isTravelPlansTableMissing(travelPlansResult.error)) {
    throw travelPlansResult.error
  }

  const fallback = await supabase
    .from('outfits')
    .select('id, title, scenario, created_at')
    .eq('user_id', userId)
    .eq('id', planId)
    .maybeSingle()

  if (fallback.error) {
    throw fallback.error
  }

  if (!fallback.data) {
    return null
  }

  return decodeTravelScenarioSnapshot(fallback.data.scenario, {
    id: fallback.data.id,
    title: fallback.data.title,
    createdAt: fallback.data.created_at
  })
}
