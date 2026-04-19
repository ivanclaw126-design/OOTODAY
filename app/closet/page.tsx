import { redirect } from 'next/navigation'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

export default async function ClosetRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const userId = session.user.id

  async function analyzeUpload(_input: { imageUrl: string }): Promise<ClosetAnalysisResult> {
    'use server'

    throw new Error('Closet action not wired yet')
  }

  async function saveItem(_draft: ClosetAnalysisDraft): Promise<void> {
    'use server'

    throw new Error('Closet action not wired yet')
  }

  await ensureProfile(userId)

  const { storageBucket } = getEnv()
  const closet = await getClosetView(userId)

  return (
    <ClosetPage
      userId={userId}
      itemCount={closet.itemCount}
      items={closet.items}
      storageBucket={storageBucket}
      analyzeUpload={analyzeUpload}
      saveItem={saveItem}
    />
  )
}
