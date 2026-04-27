'use server'

import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { analyzeInspirationImage } from '@/lib/inspiration/analyze-inspiration-image'
import { buildInspirationRemixPlan } from '@/lib/inspiration/build-inspiration-remix-plan'
import { matchClosetToInspiration } from '@/lib/inspiration/match-closet-to-inspiration'
import { resolveInspirationInput } from '@/lib/inspiration/resolve-inspiration-input'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { recordRecommendationInteraction } from '@/lib/recommendation/interactions'
import { getRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { getCandidateModelScoreMap, getEntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { getRecommendationTrendSignals } from '@/lib/recommendation/get-trend-signals'

export async function analyzeInspirationAction({ sourceUrl }: { sourceUrl: string }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const resolved = await resolveInspirationInput(sourceUrl.trim())

  if (resolved.error || !resolved.imageUrl || !resolved.sourceUrl) {
    return {
      error: resolved.error,
      analysis: null
    }
  }

  const [breakdown, closet, preferenceState, modelScoreMap, entityModelScoreMap, trendSignals, learningSignals] = await Promise.all([
    analyzeInspirationImage(resolved.imageUrl),
    getClosetView(session.user.id),
    getPreferenceState({ userId: session.user.id }),
    getCandidateModelScoreMap({ userId: session.user.id, surface: 'inspiration' }),
    getEntityModelScoreMap({ userId: session.user.id, surface: 'inspiration' }),
    getRecommendationTrendSignals(),
    getRecommendationLearningSignals({ userId: session.user.id, surface: 'inspiration' })
  ])
  const closetMatches = matchClosetToInspiration(breakdown, closet.items, preferenceState, modelScoreMap, entityModelScoreMap, trendSignals, learningSignals)
  await Promise.all(closetMatches.map((match) =>
    recordRecommendationInteraction({
      userId: session.user.id,
      surface: 'inspiration',
      eventType: match.matchedItems.length > 0 ? 'opened' : 'skipped',
      recommendationId: match.inspirationItem.id,
      candidateId: match.matchedItems[0] ? `inspiration-${match.inspirationItem.id}-${match.matchedItems[0].id}` : match.inspirationItem.id,
      itemIds: match.matchedItems.map((item) => item.id),
      context: {
        sourceUrl: resolved.sourceUrl,
        matchType: match.scoreBreakdown?.matchType,
        recallSource: 'rule',
        categoryKeys: match.matchedItems.map((item) => item.category),
        colorKeys: match.matchedItems.map((item) => item.colorCategory).filter(Boolean)
      }
    })
  ))

  return {
    error: null,
    analysis: {
      sourceUrl: resolved.sourceUrl,
      sourceTitle: resolved.sourceTitle,
      imageUrl: resolved.imageUrl,
      breakdown,
      closetMatches,
      remixPlan: buildInspirationRemixPlan(breakdown, closetMatches)
    }
  }
}
