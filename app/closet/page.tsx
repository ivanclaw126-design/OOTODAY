import { redirect } from 'next/navigation'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetInsights } from '@/lib/closet/get-closet-insights'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import {
  analyzeClosetImportUrlAction,
  analyzeClosetUploadAction,
  deleteClosetItemAction,
  reanalyzeClosetItemAction,
  saveClosetItemAction,
  toggleClosetItemImageFlipAction,
  updateClosetItemAction
} from '@/app/closet/actions'
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

  async function analyzeImportUrl(input: { sourceUrl: string }): Promise<{ error: string | null; draft: ClosetAnalysisDraft | null }> {
    'use server'

    return analyzeClosetImportUrlAction(input)
  }

  async function saveItem(draft: ClosetAnalysisDraft): Promise<void> {
    'use server'

    await saveClosetItemAction(draft)
  }

  async function deleteItem(input: { itemId: string }): Promise<void> {
    'use server'

    await deleteClosetItemAction(input)
  }

  async function updateItem(input: { itemId: string; draft: ClosetAnalysisDraft }): Promise<void> {
    'use server'

    await updateClosetItemAction(input)
  }

  async function reanalyzeItem(input: { itemId: string }): Promise<ClosetAnalysisDraft> {
    'use server'

    return reanalyzeClosetItemAction(input)
  }

  async function toggleImageFlip(input: { itemId: string; imageFlipped: boolean }): Promise<void> {
    'use server'

    await toggleClosetItemImageFlipAction(input)
  }

  await ensureProfile(userId)

  const { storageBucket } = getEnv()
  const closet = await getClosetView(userId, { limit: 0 })
  const insights = await getClosetInsights(userId, closet.items)

  return (
    <ClosetPage
      userId={userId}
      itemCount={closet.itemCount}
      items={closet.items}
      insights={insights}
      storageBucket={storageBucket}
      analyzeUpload={analyzeUpload}
      analyzeImportUrl={analyzeImportUrl}
      saveItem={saveItem}
      updateItem={updateItem}
      reanalyzeItem={reanalyzeItem}
      deleteItem={deleteItem}
      toggleImageFlip={toggleImageFlip}
    />
  )
}
