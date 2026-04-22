'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { deleteClosetItem } from '@/lib/closet/delete-closet-item'
import { saveClosetItem } from '@/lib/closet/save-closet-item'
import { getEnv } from '@/lib/env'
import { resolveShopInput } from '@/lib/shop/resolve-shop-input'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase()

  if (
    normalized === 'localhost' ||
    normalized === '0.0.0.0' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.endsWith('.local')
  ) {
    return true
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized)) {
    const [a, b] = normalized.split('.').map(Number)

    if (a === 10 || a === 127 || a === 192 && b === 168 || a === 169 && b === 254) {
      return true
    }

    if (a === 172 && b >= 16 && b <= 31) {
      return true
    }
  }

  return false
}

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
  try {
    validateClosetUploadUrl(imageUrl, userId)
    return
  } catch {
    const uploadUrl = new URL(imageUrl)

    if (uploadUrl.protocol !== 'https:' && uploadUrl.protocol !== 'http:') {
      throw new Error('Invalid closet upload URL')
    }

    if (isPrivateHostname(uploadUrl.hostname)) {
      throw new Error('Invalid closet upload URL')
    }

    if (uploadUrl.pathname.includes('/storage/v1/object/public/')) {
      throw new Error('Invalid closet upload URL')
    }
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

  const analysis = await analyzeItemImage(resolved.imageUrl)

  return {
    error: null,
    draft: {
      imageUrl: resolved.imageUrl,
      ...analysis
    } satisfies ClosetAnalysisDraft
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
