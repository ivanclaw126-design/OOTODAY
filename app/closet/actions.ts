'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { deleteClosetItem } from '@/lib/closet/delete-closet-item'
import { getClosetItem } from '@/lib/closet/get-closet-item'
import { importRemoteImageToStorage } from '@/lib/closet/import-remote-image-to-storage'
import { replaceClosetItemImage } from '@/lib/closet/replace-closet-item-image'
import { saveClosetItem } from '@/lib/closet/save-closet-item'
import { setClosetItemImageFlip } from '@/lib/closet/set-closet-item-image-flip'
import { normalizeClosetFields } from '@/lib/closet/taxonomy'
import { updateClosetItem } from '@/lib/closet/update-closet-item'
import { copyDemoClosetToUser, type DemoClosetAudience } from '@/lib/demo/demo-closet'
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
    const normalized = normalizeClosetFields(analysis)

    return {
      error: null,
      draft: {
        imageUrl: importedImage.imageUrl,
        ...normalized,
        styleTags: analysis.styleTags,
        algorithmMeta: analysis.algorithmMeta
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
    ...normalizeClosetFields(draft),
    userId: session.user.id
  })

  revalidatePath('/closet')

  return data
}

export async function updateClosetItemAction(input: { itemId: string; draft: ClosetAnalysisDraft }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  if (input.draft.imageUrl) {
    validateClosetImageUrlForSave(input.draft.imageUrl, session.user.id)
  }

  const data = await updateClosetItem({
    itemId: input.itemId,
    userId: session.user.id,
    ...input.draft,
    ...normalizeClosetFields(input.draft)
  })

  revalidatePath('/closet')
  revalidatePath('/today')

  return data
}

export async function replaceClosetItemImageAction(input: { itemId: string; draft: ClosetAnalysisDraft }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  validateClosetImageUrlForSave(input.draft.imageUrl, session.user.id)

  const data = await replaceClosetItemImage({
    itemId: input.itemId,
    userId: session.user.id,
    ...input.draft,
    ...normalizeClosetFields(input.draft)
  })

  revalidatePath('/closet')
  revalidatePath('/today')
  revalidatePath('/travel')
  revalidatePath('/looks')
  revalidatePath('/shop')

  return data
}

export async function reanalyzeClosetItemAction(input: { itemId: string }): Promise<ClosetAnalysisDraft> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const item = await getClosetItem(session.user.id, input.itemId)

  if (!item.image_url) {
    throw new Error('这件衣物没有可重新识别的图片')
  }

  validateClosetImageUrlForSave(item.image_url, session.user.id)

  const analysis = await analyzeItemImage(item.image_url)
  const normalized = normalizeClosetFields(analysis)

  return {
    imageUrl: item.image_url,
    ...normalized,
    styleTags: analysis.styleTags,
    algorithmMeta: analysis.algorithmMeta
  }
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

export async function updateClosetItemImageRotationAction(input: {
  itemId: string
  operation: 'rotate-right-90' | 'restore-original'
}) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const data = await setClosetItemImageFlip({
    userId: session.user.id,
    itemId: input.itemId,
    operation: input.operation
  })

  revalidatePath('/closet')
  revalidatePath('/today')
  revalidatePath('/travel')
  revalidatePath('/looks')
  revalidatePath('/shop')

  return data
}

export async function copyDemoClosetAction(audience: DemoClosetAudience = 'womens') {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const result = await copyDemoClosetToUser(session.user.id, audience)

  if (result.error) {
    return { error: result.error, copiedCount: 0 }
  }

  revalidatePath('/closet')
  revalidatePath('/today')
  revalidatePath('/travel')
  revalidatePath('/looks')
  revalidatePath('/shop')

  return { error: null, copiedCount: result.copiedCount }
}
