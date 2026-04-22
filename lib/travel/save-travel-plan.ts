import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { TravelPackingPlan } from '@/lib/travel/types'
import {
  buildTravelPlanTitle,
  buildTravelWeatherSummary,
  encodeTravelScenarioMetadata,
  isTravelPlansTableMissing
} from '@/lib/travel/persistence'

export async function saveTravelPlan({ userId, plan }: { userId: string; plan: TravelPackingPlan }) {
  const supabase = await createSupabaseServerClient()
  const title = buildTravelPlanTitle(plan)
  const weatherSummary = buildTravelWeatherSummary(plan)

  const { data, error } = await supabase
    .from('travel_plans')
    .insert({
      user_id: userId,
      title,
      destination_city: plan.destinationCity,
      days: plan.days,
      scenes: plan.scenes,
      weather_summary: weatherSummary,
      plan_json: plan
    })
    .select('id')
    .single()

  if (!error) {
    return {
      id: data.id,
      source: 'travel_plans' as const
    }
  }

  if (!isTravelPlansTableMissing(error)) {
    throw error
  }

  const fallback = await supabase
    .from('outfits')
    .insert({
      user_id: userId,
      title,
      item_ids: [],
      scenario: encodeTravelScenarioMetadata(plan)
    })
    .select('id')
    .single()

  if (fallback.error) {
    throw fallback.error
  }

  return {
    id: fallback.data.id,
    source: 'outfits' as const
  }
}
