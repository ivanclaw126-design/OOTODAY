import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { TravelPackingPlan } from '@/lib/travel/types'
import {
  buildTravelPlanTitle,
  buildTravelWeatherSummary,
  encodeTravelScenarioMetadata,
  isTravelPlansTableMissing
} from '@/lib/travel/persistence'

export async function saveTravelPlan({
  userId,
  plan,
  existingPlanId,
  existingSource
}: {
  userId: string
  plan: TravelPackingPlan
  existingPlanId?: string | null
  existingSource?: 'travel_plans' | 'outfits' | null
}) {
  const supabase = await createSupabaseServerClient()
  const title = buildTravelPlanTitle(plan)
  const weatherSummary = buildTravelWeatherSummary(plan)

  const travelPlanPayload = {
    title,
    destination_city: plan.destinationCity,
    days: plan.days,
    scenes: plan.scenes,
    weather_summary: weatherSummary,
    plan_json: plan
  }

  if (!existingPlanId || existingSource === 'travel_plans') {
    const travelPlansQuery = existingPlanId
      ? supabase.from('travel_plans').update(travelPlanPayload).eq('user_id', userId).eq('id', existingPlanId)
      : supabase.from('travel_plans').insert({
          user_id: userId,
          ...travelPlanPayload
        })
    const { data, error } = await travelPlansQuery.select('id').single()

    if (!error) {
      return {
        id: data.id,
        source: 'travel_plans' as const
      }
    }

    if (!isTravelPlansTableMissing(error)) {
      throw error
    }
  }

  const outfitPayload = {
    title,
    item_ids: [],
    scenario: encodeTravelScenarioMetadata(plan)
  }

  const fallbackQuery =
    existingPlanId && existingSource === 'outfits'
      ? supabase.from('outfits').update(outfitPayload).eq('user_id', userId).eq('id', existingPlanId)
      : supabase.from('outfits').insert({
          user_id: userId,
          ...outfitPayload
        })
  const fallback = await fallbackQuery.select('id').single()

  if (fallback.error) {
    throw fallback.error
  }

  return {
    id: fallback.data.id,
    source: 'outfits' as const
  }
}
