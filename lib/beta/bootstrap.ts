import { createSupabaseServerClient } from '@/lib/supabase/server'

export type BetaBootstrapState = {
  itemCount: number
  hasCity: boolean
  hasOotdHistory: boolean
  recommendedEntryRoute: '/today' | '/closet?onboarding=1'
}

export async function getBetaBootstrapState(userId: string): Promise<BetaBootstrapState> {
  const supabase = await createSupabaseServerClient()
  const [itemsResult, profileResult, ootdResult] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('profiles').select('city').eq('id', userId).maybeSingle(),
    supabase.from('ootd').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  ])

  const itemCount = itemsResult.count ?? 0
  const hasCity = Boolean(profileResult.data?.city?.trim())
  const hasOotdHistory = (ootdResult.count ?? 0) > 0

  return {
    itemCount,
    hasCity,
    hasOotdHistory,
    recommendedEntryRoute: itemCount > 0 ? '/today' : '/closet?onboarding=1'
  }
}
