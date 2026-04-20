import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import {
  refreshTodayRecommendationsAction,
  submitTodayOotdAction,
  updateTodayCityAction
} from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import type { TodayRecommendation } from '@/lib/today/types'
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

  async function refreshRecommendations() {
    'use server'

    await refreshTodayRecommendationsAction((Number.isNaN(offset) ? 0 : offset) + 1)
  }

  return (
    <TodayPage
      view={view}
      updateCity={updateCity}
      submitOotd={submitOotd}
      refreshRecommendations={refreshRecommendations}
    />
  )
}
