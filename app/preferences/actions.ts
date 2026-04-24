'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { submitQuestionnaire } from '@/lib/recommendation/submit-questionnaire'
import type { StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'

export async function submitStyleQuestionnaireAction(answers: StyleQuestionnaireAnswers) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await ensureProfile(session.user.id)

  try {
    await submitQuestionnaire({
      userId: session.user.id,
      answers
    })
  } catch {
    return { error: '风格问卷保存失败，请稍后重试' }
  }

  revalidatePath('/preferences')
  return { error: null }
}
