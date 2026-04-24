'use server'

import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { analyzeInspirationImage } from '@/lib/inspiration/analyze-inspiration-image'
import { buildInspirationRemixPlan } from '@/lib/inspiration/build-inspiration-remix-plan'
import { matchClosetToInspiration } from '@/lib/inspiration/match-closet-to-inspiration'
import { resolveInspirationInput } from '@/lib/inspiration/resolve-inspiration-input'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'

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

  const [breakdown, closet, preferenceState] = await Promise.all([
    analyzeInspirationImage(resolved.imageUrl),
    getClosetView(session.user.id),
    getPreferenceState({ userId: session.user.id })
  ])
  const closetMatches = matchClosetToInspiration(breakdown, closet.items, preferenceState)

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
