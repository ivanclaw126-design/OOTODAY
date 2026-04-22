'use server'

import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { analyzePurchaseCandidate, getUnsupportedShopCategoryMessage } from '@/lib/shop/analyze-purchase-candidate'
import { resolveShopInput } from '@/lib/shop/resolve-shop-input'

export async function analyzeShopCandidateAction({ sourceUrl }: { sourceUrl: string }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const resolved = await resolveShopInput(sourceUrl.trim())

  if (resolved.error || !resolved.imageUrl || !resolved.sourceUrl) {
    return {
      error: resolved.error,
      analysis: null
    }
  }

  const [candidate, closet] = await Promise.all([
    analyzeItemImage(resolved.imageUrl),
    getClosetView(session.user.id)
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
        sourceUrl: resolved.sourceUrl,
        sourceTitle: resolved.sourceTitle
      },
      closet.items
    )
  }
}
