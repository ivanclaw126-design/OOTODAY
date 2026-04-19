import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import { getSession } from '@/lib/auth/get-session'
import { getTodayState } from '@/lib/data/get-today-state'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function TodayRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)
  const state = await getTodayState(session.user.id)

  return <TodayPage itemCount={state.itemCount} hasProfile={state.hasProfile} />
}
