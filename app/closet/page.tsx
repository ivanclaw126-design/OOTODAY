import { redirect } from 'next/navigation'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetInsights } from '@/lib/closet/get-closet-insights'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { analyzeClosetUploadAction, deleteClosetItemAction, saveClosetItemAction } from '@/app/closet/actions'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

export default async function ClosetRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const userId = session.user.id

  async function analyzeUpload(input: { imageUrl: string }): Promise<ClosetAnalysisResult> {
    'use server'

    return analyzeClosetUploadAction(input)
  }

  async function saveItem(draft: ClosetAnalysisDraft): Promise<void> {
    'use server'

    await saveClosetItemAction(draft)
  }

  async function deleteItem(input: { itemId: string }): Promise<void> {
    'use server'

    await deleteClosetItemAction(input)
  }

  await ensureProfile(userId)

  const { storageBucket } = getEnv()
  const [closet, insights] = await Promise.all([getClosetView(userId, { limit: 0 }), getClosetInsights(userId)])

  return (
    <ClosetPage
      userId={userId}
      itemCount={closet.itemCount}
      items={closet.items}
      insights={insights}
      storageBucket={storageBucket}
      analyzeUpload={analyzeUpload}
      saveItem={saveItem}
      deleteItem={deleteItem}
    />
  )
}
