'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { deleteClosetItem } from '@/lib/closet/delete-closet-item'
import { importRemoteImageToStorage } from '@/lib/closet/import-remote-image-to-storage'
import { saveClosetItem } from '@/lib/closet/save-closet-item'
import { getEnv } from '@/lib/env'
import { resolveShopInput } from '@/lib/shop/resolve-shop-input'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

function validateClosetUploadUrl(imageUrl: string, userId: string) {
  const { storageBucket, supabaseUrl } = getEnv()
  const uploadUrl = new URL(imageUrl)
  const storageUrl = new URL(supabaseUrl)
  const expectedPathPrefix = `/storage/v1/object/public/${storageBucket}/${userId}/`

  if (uploadUrl.origin === storageUrl.origin && uploadUrl.pathname.startsWith(expectedPathPrefix)) {
    return
  }
  throw new Error('Invalid closet upload URL')
}

function validateClosetImageUrlForSave(imageUrl: string, userId: string) {
  validateClosetUploadUrl(imageUrl, userId)
}

export async function analyzeClosetUploadAction({ imageUrl }: { imageUrl: string }): Promise<ClosetAnalysisResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  validateClosetUploadUrl(imageUrl, session.user.id)

  return analyzeItemImage(imageUrl)
}

export async function analyzeClosetImportUrlAction({ sourceUrl }: { sourceUrl: string }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const resolved = await resolveShopInput(sourceUrl.trim())

  if (resolved.error || !resolved.imageUrl) {
    return {
      error: resolved.error ?? '导入失败，请换一个链接试试',
      draft: null
    }
  }

  try {
    const importedImage = await importRemoteImageToStorage({
      sourceUrl: resolved.imageUrl,
      userId: session.user.id
    })
    const analysis = await analyzeItemImage(importedImage.imageUrl)

    return {
      error: null,
      draft: {
        imageUrl: importedImage.imageUrl,
        ...analysis
      } satisfies ClosetAnalysisDraft
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '导入失败，请换一个链接试试',
      draft: null
    }
  }
}

export async function saveClosetItemAction(draft: ClosetAnalysisDraft) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  validateClosetImageUrlForSave(draft.imageUrl, session.user.id)

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
