import { createSupabaseServerClient } from '@/lib/supabase/server'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'
import type { TodayRecommendation } from '@/lib/today/types'

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

export async function saveTodayOotdFeedback({
  userId,
  recommendation,
  satisfactionScore
}: {
  userId: string
  recommendation: TodayRecommendation
  satisfactionScore: number
}) {
  if (!Number.isInteger(satisfactionScore) || satisfactionScore < 1 || satisfactionScore > 5) {
    return { error: '请先选择满意度', wornAt: null }
  }

  const supabase = await createSupabaseServerClient()
  const { start, end } = todayRange()

  const { data: existing, error: existingError } = await supabase
    .from('ootd')
    .select('id, worn_at')
    .eq('user_id', userId)
    .gte('worn_at', start)
    .lt('worn_at', end)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return { error: '今天已经记录过穿搭了', wornAt: null }
  }

  const wornAt = new Date().toISOString()
  const { error } = await supabase.from('ootd').insert({
    user_id: userId,
    worn_at: wornAt,
    satisfaction_score: satisfactionScore,
    notes: buildOotdNotes(recommendation)
  })

  if (error) {
    if ('code' in error && error.code === '23505') {
      return { error: '今天已经记录过穿搭了', wornAt: null }
    }

    throw error
  }

  return { error: null, wornAt }
}
