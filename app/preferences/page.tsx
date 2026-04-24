import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { StyleQuestionnairePage } from '@/components/preferences/style-questionnaire-page'
import { submitStyleQuestionnaireAction } from '@/app/preferences/actions'
import { getSession } from '@/lib/auth/get-session'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import type { StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'

export default async function PreferencesRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  async function submitAnswers(answers: StyleQuestionnaireAnswers) {
    'use server'

    return submitStyleQuestionnaireAction(answers)
  }

  return (
    <AppShell title="风格问卷">
      <StyleQuestionnairePage submitAnswers={submitAnswers} />
    </AppShell>
  )
}
