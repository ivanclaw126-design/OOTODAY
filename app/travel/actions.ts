'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { deleteTravelPlan } from '@/lib/travel/delete-travel-plan'
import { saveTravelPlan } from '@/lib/travel/save-travel-plan'
import type { TravelPackingPlan, TravelSavedPlanSource } from '@/lib/travel/types'

export async function saveTravelPlanAction(formData: FormData) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const serializedPlan = formData.get('plan')
  const city = formData.get('city')
  const days = formData.get('days')
  const scenes = formData.getAll('scene')

  if (typeof serializedPlan !== 'string') {
    throw new Error('旅行方案内容缺失，暂时无法保存')
  }

  const plan = JSON.parse(serializedPlan) as TravelPackingPlan

  const savedPlan = await saveTravelPlan({
    userId: session.user.id,
    plan
  })

  revalidatePath('/travel')

  const params = new URLSearchParams()

  if (typeof city === 'string' && city) {
    params.set('city', city)
  }

  if (typeof days === 'string' && days) {
    params.set('days', days)
  }

  for (const scene of scenes) {
    if (typeof scene === 'string' && scene) {
      params.append('scene', scene)
    }
  }

  params.set('savedPlanId', savedPlan.id)
  params.set('saved', '1')
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
