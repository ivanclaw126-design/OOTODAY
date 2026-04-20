'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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

export async function refreshTodayRecommendationsAction() {
  revalidatePath('/today')
}
