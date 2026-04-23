'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { validatePassword } from '@/lib/auth/password'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { saveTodayOotdFeedback } from '@/lib/today/save-today-ootd-feedback'
import { getWeather } from '@/lib/today/get-weather'
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
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const supabase = await createSupabaseServerClient()
  const [{ data: profile }, closet] = await Promise.all([
    supabase.from('profiles').select('city').eq('id', session.user.id).maybeSingle(),
    getClosetView(session.user.id)
  ])

  if (closet.itemCount === 0) {
    return { recommendations: [] }
  }

  const city = profile?.city ?? null
  const weather = city ? await getWeather(city) : null

  return {
    recommendations: generateTodayRecommendations(closet.items, weather, offset)
  }
}

export async function changeTodayPasswordAction({
  password,
  confirmPassword
}: {
  password: string
  confirmPassword: string
}) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const passwordError = validatePassword(password)

  if (passwordError) {
    return { error: passwordError }
  }

  if (password !== confirmPassword) {
    return { error: '两次输入的密码不一致' }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { error: updateUserError } = await supabase.auth.updateUser({
    password,
    data: {
      ...(user?.user_metadata ?? {}),
      password_bootstrapped: true,
      password_changed_at: new Date().toISOString()
    }
  })

  if (updateUserError) {
    return { error: '密码修改失败，请稍后重试' }
  }

  revalidatePath('/today')
  return { error: null }
}
