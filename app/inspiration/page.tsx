import { redirect } from 'next/navigation'
import { analyzeInspirationAction } from '@/app/inspiration/actions'
import { InspirationPage } from '@/components/inspiration/inspiration-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function InspirationRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const closet = await getClosetView(session.user.id)
  const { storageBucket } = getEnv()

  async function analyzeInspiration(input: { sourceUrl: string }) {
    'use server'

    return analyzeInspirationAction(input)
  }

  return (
    <InspirationPage
      itemCount={closet.itemCount}
      userId={session.user.id}
      storageBucket={storageBucket}
      analyzeInspiration={analyzeInspiration}
    />
  )
}
