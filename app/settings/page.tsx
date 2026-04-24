import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { SettingsPage } from '@/components/settings/settings-page'
import {
  clearClosetAction,
  copyDemoClosetAction,
  resetRecommendationPreferencesAction,
  restartStyleQuestionnaireAction
} from '@/app/settings/actions'
import { getSession } from '@/lib/auth/get-session'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'

export default async function SettingsRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const preferenceState = await getPreferenceState({
    userId: session.user.id
  })

  async function resetPreferences() {
    'use server'

    return resetRecommendationPreferencesAction()
  }

  async function restartQuestionnaire() {
    'use server'

    return restartStyleQuestionnaireAction()
  }

  async function copyDemoCloset() {
    'use server'

    return copyDemoClosetAction()
  }

  async function clearCloset() {
    'use server'

    return clearClosetAction()
  }

  return (
    <AppShell title="AI 造型引擎">
      <SettingsPage
        source={preferenceState.source}
        updatedAt={preferenceState.updatedAt}
        resetPreferences={resetPreferences}
        restartQuestionnaire={restartQuestionnaire}
        copyDemoCloset={copyDemoCloset}
        clearCloset={clearCloset}
      />
    </AppShell>
  )
}
