'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { deleteClosetItem } from '@/lib/closet/delete-closet-item'
import { saveClosetItem } from '@/lib/closet/save-closet-item'
import { getEnv } from '@/lib/env'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

function validateClosetUploadUrl(imageUrl: string, userId: string) {
  const { storageBucket, supabaseUrl } = getEnv()
  const uploadUrl = new URL(imageUrl)
  const storageUrl = new URL(supabaseUrl)
  const expectedPathPrefix = `/storage/v1/object/public/${storageBucket}/${userId}/`

  if (uploadUrl.origin !== storageUrl.origin) {
    throw new Error('Invalid closet upload URL')
  }

  if (!uploadUrl.pathname.startsWith(expectedPathPrefix)) {
    throw new Error('Invalid closet upload URL')
  }
}

export async function analyzeClosetUploadAction({ imageUrl }: { imageUrl: string }): Promise<ClosetAnalysisResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  validateClosetUploadUrl(imageUrl, session.user.id)

  return analyzeItemImage(imageUrl)
}

export async function saveClosetItemAction(draft: ClosetAnalysisDraft) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  validateClosetUploadUrl(draft.imageUrl, session.user.id)

  const data = await saveClosetItem({
    ...draft,
    userId: session.user.id
  })

  revalidatePath('/closet')

  return data
}

export async function deleteClosetItemAction(input: { itemId: string }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await deleteClosetItem({
    userId: session.user.id,
    itemId: input.itemId
  })

  revalidatePath('/closet')
}
