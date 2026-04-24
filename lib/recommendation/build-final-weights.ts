import { SCORE_WEIGHT_KEYS, type ScoreWeights } from '@/lib/recommendation/preference-types'

export const MIN_SCORE_WEIGHT = 0.04
export const MAX_SCORE_WEIGHT = 0.28

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function emptyWeights(): ScoreWeights {
  return {
    colorHarmony: 0,
    silhouetteBalance: 0,
    layering: 0,
    focalPoint: 0,
    sceneFit: 0,
    weatherComfort: 0,
    completeness: 0,
    freshness: 0
  }
}

export function sumScoreWeights(weights: ScoreWeights) {
  return SCORE_WEIGHT_KEYS.reduce((sum, key) => sum + weights[key], 0)
}

function normalizeWithinBounds(clampedWeights: ScoreWeights): ScoreWeights {
  const normalized = { ...clampedWeights }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const total = sumScoreWeights(normalized)
    const residual = 1 - total

    if (Math.abs(residual) < 0.000001) {
      break
    }

    const canMove = SCORE_WEIGHT_KEYS.filter((key) =>
      residual > 0 ? normalized[key] < MAX_SCORE_WEIGHT : normalized[key] > MIN_SCORE_WEIGHT
    )

    if (canMove.length === 0) {
      break
    }

    const capacity = canMove.reduce((sum, key) => {
      return sum + (residual > 0 ? MAX_SCORE_WEIGHT - normalized[key] : normalized[key] - MIN_SCORE_WEIGHT)
    }, 0)

    if (capacity <= 0) {
      break
    }

    for (const key of canMove) {
      const keyCapacity = residual > 0 ? MAX_SCORE_WEIGHT - normalized[key] : normalized[key] - MIN_SCORE_WEIGHT
      const movement = Math.min(Math.abs(residual), capacity) * (keyCapacity / capacity)
      normalized[key] = residual > 0
        ? clamp(normalized[key] + movement, MIN_SCORE_WEIGHT, MAX_SCORE_WEIGHT)
        : clamp(normalized[key] - movement, MIN_SCORE_WEIGHT, MAX_SCORE_WEIGHT)
    }
  }

  const finalTotal = sumScoreWeights(normalized)

  if (Math.abs(finalTotal - 1) > 0.000001) {
    const fallback = emptyWeights()
    const equalWeight = 1 / SCORE_WEIGHT_KEYS.length
    SCORE_WEIGHT_KEYS.forEach((key) => {
      fallback[key] = equalWeight
    })
    return fallback
  }

  return normalized
}

export function buildFinalWeights(
  defaultWeights: ScoreWeights,
  questionnaireDelta: Partial<ScoreWeights> = {},
  ratingDelta: Partial<ScoreWeights> = {}
): ScoreWeights {
  const clamped = emptyWeights()

  SCORE_WEIGHT_KEYS.forEach((key) => {
    clamped[key] = clamp(
      defaultWeights[key] + (questionnaireDelta[key] ?? 0) + (ratingDelta[key] ?? 0),
      MIN_SCORE_WEIGHT,
      MAX_SCORE_WEIGHT
    )
  })

  return normalizeWithinBounds(clamped)
}
