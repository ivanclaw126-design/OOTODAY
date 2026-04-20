'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { saveTodayOotdFeedback } from '@/lib/today/save-today-ootd-feedback'
import type { TodayRecommendation } from '@/lib/today/types'

export async function updateTodayCityAction({ city }: { city: string }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const normalizedCity = city.trim()

  if (!normalizedCity) {
    return { error: '城市不能为空' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('profiles').update({ city: normalizedCity }).eq('id', session.user.id)

  if (error) {
    return { error: '城市保存失败，请稍后重试' }
  }

  revalidatePath('/today')
  return { error: null }
}

export async function submitTodayOotdAction({
  recommendation,
  satisfactionScore
}: {
  recommendation: TodayRecommendation
  satisfactionScore: number
}) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const result = await saveTodayOotdFeedback({
    userId: session.user.id,
    recommendation,
    satisfactionScore
  })

  if (!result.error) {
    revalidatePath('/today')
  }

  return result
}

export async function refreshTodayRecommendationsAction(offset: number) {
  revalidatePath('/today')
  redirect(`/today?offset=${offset}`)
}
