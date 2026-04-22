import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { TodayOotdHistoryEntry } from '@/lib/today/types'

export async function getRecentOotdHistory(userId: string, limit = 5): Promise<TodayOotdHistoryEntry[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('ootd')
    .select('id, worn_at, satisfaction_score, notes')
    .eq('user_id', userId)
    .order('worn_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    wornAt: entry.worn_at,
    satisfactionScore: entry.satisfaction_score,
    notes: entry.notes
  }))
}
