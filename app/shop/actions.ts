'use server'

import { sourceDomainFromUrl } from '@/lib/analytics/events'
import { trackServerEvent } from '@/lib/analytics/server'
import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { recordRecommendationInteraction } from '@/lib/recommendation/interactions'
import { getCandidateModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { analyzePurchaseCandidate, getShopCandidateId, getUnsupportedShopCategoryMessage } from '@/lib/shop/analyze-purchase-candidate'
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
  const sourceDomain = sourceDomainFromUrl(sourceUrl.trim())

  if (resolved.error || !resolved.imageUrl || !resolved.sourceUrl) {
    await trackServerEvent({
      userId: session.user.id,
      eventName: 'shop_candidate_analyze_failed',
      module: 'shop',
      route: '/shop',
      properties: {
        sourceDomain,
        errorCode: 'input_resolution_failed'
      }
    })
    return {
      error: resolved.error,
      analysis: null
    }
  }

  const [candidate, closet, preferenceState, modelScoreMap] = await Promise.all([
    analyzeItemImage(resolved.imageUrl),
    getClosetView(session.user.id, { limit: 0 }),
    getPreferenceState({ userId: session.user.id }),
    getCandidateModelScoreMap({ userId: session.user.id, surface: 'shop' })
  ])

  const unsupportedCategoryMessage = getUnsupportedShopCategoryMessage(candidate.category)

  if (unsupportedCategoryMessage) {
    await trackServerEvent({
      userId: session.user.id,
      eventName: 'shop_candidate_analyze_failed',
      module: 'shop',
      route: '/shop',
      properties: {
        sourceDomain,
        errorCode: 'unsupported_category',
        category: candidate.category
      }
    })
    return {
      error: unsupportedCategoryMessage,
      analysis: null
    }
  }

  const analysis = analyzePurchaseCandidate(
    {
      ...candidate,
      imageUrl: resolved.imageUrl,
      imageCandidates: resolved.imageCandidates,
      sourceUrl: resolved.sourceUrl,
      sourceTitle: resolved.sourceTitle
    },
    closet.items,
    preferenceState,
    modelScoreMap
  )
  await recordRecommendationInteraction({
    userId: session.user.id,
    surface: 'shop',
    eventType: analysis.recommendation === 'buy' ? 'saved' : analysis.recommendation === 'skip' ? 'skipped' : 'opened',
    recommendationId: analysis.candidate.sourceUrl,
    candidateId: analysis.scoreBreakdown ? getShopCandidateId(analysis.candidate) : analysis.candidate.sourceUrl,
    context: {
      recommendation: analysis.recommendation,
      duplicateRisk: analysis.duplicateRisk,
      estimatedOutfitCount: analysis.estimatedOutfitCount
    },
    scoreBreakdown: analysis.scoreBreakdown ?? null
  })

  await trackServerEvent({
    userId: session.user.id,
    eventName: 'shop_candidate_analyze_succeeded',
    module: 'shop',
    route: '/shop',
    properties: {
      sourceDomain,
      category: candidate.category,
      colorCategory: candidate.colorCategory,
      matchedClosetCount: analysis.duplicateItems.length,
      recommendation: analysis.recommendation
    }
  })

  return {
    error: null,
    analysis
  }
}
