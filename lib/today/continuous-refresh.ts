import type { PreferenceProfile } from '@/lib/recommendation/preference-types'
import type { TodayRecommendation, TodayRecommendationMode } from '@/lib/today/types'

const MIN_INSPIRATION_INTERVAL = 3
const MAX_INSPIRATION_INTERVAL = 10

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function stableJitter(seed: number) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453
  return Math.floor((raw - Math.floor(raw)) * 3) - 1
}

export function getContinuationInspirationInterval({
  explorationRate,
  refreshCount
}: {
  explorationRate: number
  refreshCount: number
}) {
  const normalizedRate = clamp(explorationRate / 0.14, 0, 1)
  const baseInterval = Math.round(MAX_INSPIRATION_INTERVAL - normalizedRate * (MAX_INSPIRATION_INTERVAL - MIN_INSPIRATION_INTERVAL))
  return clamp(baseInterval + stableJitter(refreshCount + 1), MIN_INSPIRATION_INTERVAL, MAX_INSPIRATION_INTERVAL)
}

export function getNextContinuationMode({
  refreshCount,
  exploration
}: {
  refreshCount: number
  exploration: PreferenceProfile['exploration']
}): TodayRecommendationMode {
  if (!exploration.enabled || exploration.rate <= 0) {
    return 'daily'
  }

  const nextRefreshNumber = refreshCount + 1
  const interval = getContinuationInspirationInterval({
    explorationRate: exploration.rate,
    refreshCount
  })

  return nextRefreshNumber % interval === 0 ? 'inspiration' : 'daily'
}

export function mergeContinuousRecommendations({
  currentRecommendations,
  newRecommendation,
  recordedRecommendationId,
  maxCount = 3
}: {
  currentRecommendations: TodayRecommendation[]
  newRecommendation: TodayRecommendation | null
  recordedRecommendationId: string | null
  maxCount?: number
}) {
  const current = currentRecommendations.slice(0, maxCount)

  if (!newRecommendation || current.some((recommendation) => recommendation.id === newRecommendation.id)) {
    return current
  }

  if (current.length < maxCount) {
    return [...current, newRecommendation].slice(-maxCount)
  }

  const replacementIndex = current.findIndex((recommendation) => recommendation.id !== recordedRecommendationId)

  if (replacementIndex < 0) {
    return current
  }

  return [
    ...current.slice(0, replacementIndex),
    ...current.slice(replacementIndex + 1),
    newRecommendation
  ].slice(0, maxCount)
}
