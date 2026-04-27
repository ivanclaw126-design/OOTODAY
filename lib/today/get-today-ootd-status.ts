import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { TodayOotdStatus } from '@/lib/today/types'

function todayRange(now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(24, 0, 0, 0)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

export async function getTodayOotdStatus(userId: string): Promise<TodayOotdStatus> {
  const supabase = await createSupabaseServerClient()
  const { start, end } = todayRange()

  const { data, error } = await supabase
    .from('ootd')
    .select('id, worn_at')
    .eq('user_id', userId)
    .gte('worn_at', start)
    .lt('worn_at', end)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return { status: 'not-recorded' }
  }

  return {
    status: 'recorded',
    wornAt: data.worn_at,
    ootdId: data.id
  }
}
