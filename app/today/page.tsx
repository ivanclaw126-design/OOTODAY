import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import { TodayWorkspaceFallback } from '@/components/today/today-workspace-fallback'
import { AppShell } from '@/components/app-shell'
import {
  changeTodayPasswordAction,
  deleteTodayHistoryEntryAction,
  getTodayRecentHistoryAction,
  recordTodayRecommendationExposedAction,
  recordTodayRecommendationOpenedAction,
  refreshTodayRecommendationsAction,
  replaceTodayRecommendationSlotAction,
  resolveTodayWeatherAction,
  signOutTodayAction,
  submitTodayPreChoiceFeedbackAction,
  chooseTodayRecommendationAction,
  undoTodayRecommendationAction,
  updateTodayHistoryEntryAction,
  updateTodayCityAction
} from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import type {
  TodayChooseRecommendationInput,
  TodayHistoryUpdateInput,
  TodayRecommendation,
  TodayPreChoiceFeedbackInput,
  TodayRecommendationRefreshInput,
  TodaySlotReplacementInput
} from '@/lib/today/types'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { trackServerEvent } from '@/lib/analytics/server'

async function TodayRouteContent({
  searchParams
}: {
  searchParams?: Promise<{ offset?: string }>
}) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const supabase = await createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('city')
    .eq('id', session.user.id)
    .maybeSingle()

  const resolvedSearchParams = (await searchParams) ?? {}
  const offset = Number.parseInt(resolvedSearchParams.offset ?? '0', 10)

  const view = await getTodayView({
    userId: session.user.id,
    city: profile?.city ?? null,
    accountEmail: session.user.email ?? null,
    passwordBootstrapped: Boolean(session.user.user_metadata?.password_bootstrapped),
    passwordChangedAt: typeof session.user.user_metadata?.password_changed_at === 'string' ? session.user.user_metadata.password_changed_at : null,
    offset: Number.isNaN(offset) ? 0 : offset
  })

  if (view.itemCount === 0) {
    void trackServerEvent({
      userId: session.user.id,
      eventName: 'today_empty_closet_blocked',
      module: 'today',
      route: '/today',
      properties: {
        itemCount: 0
      }
    })
  } else if (view.recommendations.length > 0 && view.recommendationSource === 'generated') {
    void trackServerEvent({
      userId: session.user.id,
      eventName: 'today_recommendation_generated',
      module: 'today',
      route: '/today',
      properties: {
        recommendationCount: view.recommendations.length,
        offset: Number.isNaN(offset) ? 0 : offset,
        itemCount: view.itemCount,
        city: view.city,
        targetDate: view.targetDate ?? 'today',
        scene: view.scene ?? null,
        weatherAvailable: view.weatherState.status === 'ready'
      }
    })
  }

  async function updateCity(input: { city: string }) {
    'use server'

    return updateTodayCityAction(input)
  }

  async function chooseRecommendation(input: TodayChooseRecommendationInput) {
    'use server'

    return chooseTodayRecommendationAction(input)
  }

  async function undoTodaySelection() {
    'use server'

    return undoTodayRecommendationAction()
  }

  async function refreshRecommendations(input: TodayRecommendationRefreshInput) {
    'use server'

    return refreshTodayRecommendationsAction(input)
  }

  async function replaceRecommendationSlot(input: TodaySlotReplacementInput) {
    'use server'

    return replaceTodayRecommendationSlotAction(input)
  }

  async function submitPreChoiceFeedback(input: TodayPreChoiceFeedbackInput) {
    'use server'

    return submitTodayPreChoiceFeedbackAction(input)
  }

  async function recordRecommendationOpened(input: TodayChooseRecommendationInput & { source: 'details' | 'quick_feedback' }) {
    'use server'

    return recordTodayRecommendationOpenedAction(input)
  }

  async function recordRecommendationExposed(input: {
    recommendations: TodayRecommendation[]
    targetDate?: TodayRecommendationRefreshInput['targetDate']
    scene?: TodayRecommendationRefreshInput['scene']
    offset?: number
    weatherAvailable?: boolean
  }) {
    'use server'

    return recordTodayRecommendationExposedAction(input)
  }

  async function getRecentHistory() {
    'use server'

    return getTodayRecentHistoryAction()
  }

  async function resolveWeather(input: { targetDate?: TodayRecommendationRefreshInput['targetDate'] }) {
    'use server'

    return resolveTodayWeatherAction(input)
  }

  async function changePassword(input: { password: string; confirmPassword: string }) {
    'use server'

    return changeTodayPasswordAction(input)
  }

  async function signOut() {
    'use server'

    return signOutTodayAction()
  }

  async function updateHistoryEntry(input: TodayHistoryUpdateInput) {
    'use server'

    return updateTodayHistoryEntryAction(input)
  }

  async function deleteHistoryEntry(input: { ootdId: string }) {
    'use server'

    return deleteTodayHistoryEntryAction(input)
  }

  return (
    <TodayPage
      view={view}
      updateCity={updateCity}
      chooseRecommendation={chooseRecommendation}
      undoTodaySelection={undoTodaySelection}
      refreshRecommendations={refreshRecommendations}
      replaceRecommendationSlot={replaceRecommendationSlot}
      submitPreChoiceFeedback={submitPreChoiceFeedback}
      recordRecommendationOpened={recordRecommendationOpened}
      recordRecommendationExposed={recordRecommendationExposed}
      getRecentHistory={getRecentHistory}
      resolveWeather={resolveWeather}
      changePassword={changePassword}
      signOut={signOut}
      updateHistoryEntry={updateHistoryEntry}
      deleteHistoryEntry={deleteHistoryEntry}
    />
  )
}

export default function TodayRoute({
  searchParams
}: {
  searchParams?: Promise<{ offset?: string }>
}) {
  return (
    <Suspense
      fallback={
        <AppShell title="Today">
          <TodayWorkspaceFallback />
        </AppShell>
      }
    >
      <TodayRouteContent searchParams={searchParams} />
    </Suspense>
  )
}
