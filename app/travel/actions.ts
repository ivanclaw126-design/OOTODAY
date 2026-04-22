'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { buildTravelPackingPlan } from '@/lib/travel/build-travel-packing-plan'
import { deleteTravelPlan } from '@/lib/travel/delete-travel-plan'
import { saveTravelPlan } from '@/lib/travel/save-travel-plan'
import type { TravelSavedPlanSource, TravelScene } from '@/lib/travel/types'
import { getWeather } from '@/lib/today/get-weather'

const allowedScenes: TravelScene[] = ['通勤', '休闲', '正式', '约会', '户外']

function normalizeScenes(values: FormDataEntryValue[]): TravelScene[] {
  return values.filter((value): value is TravelScene => typeof value === 'string' && allowedScenes.includes(value as TravelScene))
}

export async function saveTravelPlanAction(formData: FormData) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const city = formData.get('city')
  const days = formData.get('days')
  const scenes = normalizeScenes(formData.getAll('scene'))
  const existingPlanId = formData.get('savedPlanId')
  const existingPlanSource = formData.get('savedPlanSource')

  if (typeof city !== 'string' || !city.trim()) {
    throw new Error('目的地城市不能为空')
  }

  const parsedDays = typeof days === 'string' ? Number.parseInt(days, 10) : Number.NaN

  if (Number.isNaN(parsedDays)) {
    throw new Error('出行天数无效')
  }

  const normalizedDays = Math.min(Math.max(parsedDays, 1), 14)
  const normalizedCity = city.trim()
  const closet = await getClosetView(session.user.id, { limit: 0 })

  if (closet.itemCount === 0) {
    throw new Error('衣橱还没有可用于旅行打包的单品')
  }

  const plan = buildTravelPackingPlan({
    destinationCity: normalizedCity,
    days: normalizedDays,
    scenes,
    items: closet.items,
    weather: await getWeather(normalizedCity)
  })

  const savedPlan = await saveTravelPlan({
    userId: session.user.id,
    plan,
    existingPlanId: typeof existingPlanId === 'string' && existingPlanId ? existingPlanId : null,
    existingSource:
      existingPlanSource === 'travel_plans' || existingPlanSource === 'outfits' ? existingPlanSource : null
  })

  revalidatePath('/travel')

  const params = new URLSearchParams()

  params.set('city', normalizedCity)

  params.set('days', String(normalizedDays))

  for (const scene of scenes) {
    params.append('scene', scene)
  }

  params.set('savedPlanId', savedPlan.id)
  params.set(typeof existingPlanId === 'string' && existingPlanId ? 'updated' : 'saved', '1')
  redirect(`/travel?${params.toString()}`)
}

export async function deleteTravelPlanAction(input: { planId: string; source: TravelSavedPlanSource }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await deleteTravelPlan({
    userId: session.user.id,
    planId: input.planId,
    source: input.source
  })

  revalidatePath('/travel')
}
