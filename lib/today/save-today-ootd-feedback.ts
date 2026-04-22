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

function getRecommendationItemIds(recommendation: TodayRecommendation) {
  return [
    recommendation.top?.id,
    recommendation.bottom?.id,
    recommendation.dress?.id,
    recommendation.outerLayer?.id
  ].filter((id): id is string => Boolean(id))
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

  const itemIds = getRecommendationItemIds(recommendation)

  if (itemIds.length > 0) {
    const wornDate = wornAt.slice(0, 10)
    const { data: existingItems, error: itemsError } = await supabase
      .from('items')
      .select('id, wear_count')
      .eq('user_id', userId)
      .in('id', itemIds)

    if (itemsError) {
      throw itemsError
    }

    const updateResults = await Promise.all(
      (existingItems ?? []).map((item) =>
        supabase
          .from('items')
          .update({
            last_worn_date: wornDate,
            wear_count: (item.wear_count ?? 0) + 1
          })
          .eq('user_id', userId)
          .eq('id', item.id)
      )
    )

    const updateError = updateResults.find((result) => result.error)?.error

    if (updateError) {
      throw updateError
    }
  }

  return { error: null, wornAt }
}
