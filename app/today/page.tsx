import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import {
  changeTodayPasswordAction,
  deleteTodayHistoryEntryAction,
  refreshTodayRecommendationsAction,
  submitTodayOotdAction,
  updateTodayHistoryEntryAction,
  updateTodayCityAction
} from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import type { TodayHistoryUpdateInput, TodayRecommendation } from '@/lib/today/types'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function TodayRoute({
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

  async function updateCity(input: { city: string }) {
    'use server'

    return updateTodayCityAction(input)
  }

  async function submitOotd(input: { recommendation: TodayRecommendation; satisfactionScore: number }) {
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
      updateHistoryEntry={updateHistoryEntry}
      deleteHistoryEntry={deleteHistoryEntry}
    />
  )
}
