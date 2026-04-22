import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { TravelSavedPlanSource } from '@/lib/travel/types'

export async function deleteTravelPlan({
  userId,
  planId,
  source
}: {
  userId: string
  planId: string
  source: TravelSavedPlanSource
}) {
  const supabase = await createSupabaseServerClient()

  if (source === 'travel_plans') {
    const { error } = await supabase.from('travel_plans').delete().eq('user_id', userId).eq('id', planId)

    if (error) {
      throw error
    }

    return
  }

  const { data, error } = await supabase
    .from('outfits')
    .select('id, scenario')
    .eq('user_id', userId)
    .eq('id', planId)
    .single()

  if (error) {
    throw error
  }

  if (!data.scenario?.startsWith('travel:')) {
    throw new Error('Invalid travel plan source')
  }

  const { error: deleteError } = await supabase.from('outfits').delete().eq('user_id', userId).eq('id', planId)

  if (deleteError) {
    throw deleteError
  }
}
