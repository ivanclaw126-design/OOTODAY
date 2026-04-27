import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import { TodayWorkspaceFallback } from '@/components/today/today-workspace-fallback'
import { AppShell } from '@/components/app-shell'
import {
  changeTodayPasswordAction,
  deleteTodayHistoryEntryAction,
  refreshTodayRecommendationsAction,
  signOutTodayAction,
  submitTodayOotdAction,
  updateTodayHistoryEntryAction,
  updateTodayCityAction
} from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import type { TodayHistoryUpdateInput, TodayOotdFeedbackInput } from '@/lib/today/types'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { trackServerEvent } from '@/lib/analytics/server'
import { recordRecommendationInteraction } from '@/lib/recommendation/interactions'

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
    await trackServerEvent({
      userId: session.user.id,
      eventName: 'today_empty_closet_blocked',
      module: 'today',
      route: '/today',
      properties: {
        itemCount: 0
      }
    })
  } else if (view.recommendations.length > 0) {
    await trackServerEvent({
      userId: session.user.id,
      eventName: 'today_recommendation_generated',
      module: 'today',
      route: '/today',
      properties: {
        recommendationCount: view.recommendations.length,
        offset: Number.isNaN(offset) ? 0 : offset,
        itemCount: view.itemCount,
        city: view.city,
        weatherAvailable: view.weatherState.status === 'ready'
      }
    })
    await Promise.all(view.recommendations.map((recommendation) =>
      recordRecommendationInteraction({
        userId: session.user.id,
        surface: 'today',
        eventType: 'exposed',
        recommendationId: recommendation.id,
        itemIds: [
          recommendation.top?.id,
          recommendation.bottom?.id,
          recommendation.dress?.id,
          recommendation.outerLayer?.id,
          recommendation.shoes?.id,
          recommendation.bag?.id,
          ...(recommendation.accessories ?? []).map((item) => item.id)
        ].filter((id): id is string => Boolean(id)),
        context: {
          offset: Number.isNaN(offset) ? 0 : offset,
          weatherAvailable: view.weatherState.status === 'ready'
        },
        scoreBreakdown: recommendation.scoreBreakdown ?? null
      })
    ))
  }

  async function updateCity(input: { city: string }) {
    'use server'

    return updateTodayCityAction(input)
  }

  async function submitOotd(input: TodayOotdFeedbackInput) {
    'use server'

    return submitTodayOotdAction(input)
  }

  async function refreshRecommendations(input: { offset: number }) {
    'use server'

    return refreshTodayRecommendationsAction(input.offset)
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
      submitOotd={submitOotd}
      refreshRecommendations={refreshRecommendations}
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
