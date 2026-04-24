'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'
import { savePreferenceState } from '@/lib/recommendation/save-preference-state'

async function saveDefaultPreferenceState(userId: string) {
  const state = resetRecommendationPreferences()

  await savePreferenceState({
    userId,
    state,
    questionnaireAnswers: null
  })

  return state
}

export async function resetRecommendationPreferencesAction() {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await ensureProfile(session.user.id)

  try {
    await saveDefaultPreferenceState(session.user.id)
  } catch {
    return { error: '推荐权重重置失败，请稍后重试' }
  }

  revalidatePath('/settings')
  revalidatePath('/today')
  revalidatePath('/preferences')

  return { error: null }
}

export async function restartStyleQuestionnaireAction() {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await ensureProfile(session.user.id)

  try {
    await saveDefaultPreferenceState(session.user.id)
  } catch {
    return { error: '进入风格问卷失败，请稍后重试' }
  }

  revalidatePath('/settings')
  revalidatePath('/preferences')
  redirect('/preferences')
}
