import { redirect } from 'next/navigation'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetSummary } from '@/lib/data/get-closet-summary'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function ClosetRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)
  const summary = await getClosetSummary(session.user.id)

  return <ClosetPage itemCount={summary.itemCount} />
}
