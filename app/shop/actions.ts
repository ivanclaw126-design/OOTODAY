'use server'

import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { analyzePurchaseCandidate, getUnsupportedShopCategoryMessage } from '@/lib/shop/analyze-purchase-candidate'
import { resolveShopInput } from '@/lib/shop/resolve-shop-input'

export async function analyzeShopCandidateAction({
  sourceUrl,
  preferredImageUrl
}: {
  sourceUrl: string
  preferredImageUrl?: string
}) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const resolved = await resolveShopInput(sourceUrl.trim(), {
    preferredImageUrl: preferredImageUrl?.trim() || undefined
  })

  if (resolved.error || !resolved.imageUrl || !resolved.sourceUrl) {
    return {
      error: resolved.error,
      analysis: null
    }
  }

  const [candidate, closet, preferenceState] = await Promise.all([
    analyzeItemImage(resolved.imageUrl),
    getClosetView(session.user.id, { limit: 0 }),
    getPreferenceState({ userId: session.user.id })
  ])

  const unsupportedCategoryMessage = getUnsupportedShopCategoryMessage(candidate.category)

  if (unsupportedCategoryMessage) {
    return {
      error: unsupportedCategoryMessage,
      analysis: null
    }
  }

  return {
    error: null,
    analysis: analyzePurchaseCandidate(
      {
        ...candidate,
        imageUrl: resolved.imageUrl,
        imageCandidates: resolved.imageCandidates,
        sourceUrl: resolved.sourceUrl,
        sourceTitle: resolved.sourceTitle
      },
      closet.items,
      preferenceState
    )
  }
}
