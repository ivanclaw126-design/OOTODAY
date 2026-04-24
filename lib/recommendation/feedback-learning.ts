import { buildFinalWeights } from '@/lib/recommendation/build-final-weights'
import { SCORE_WEIGHT_KEYS, type ScoreWeightKey, type ScoreWeights, type TodayFeedbackReasonTag } from '@/lib/recommendation/preference-types'

export const FEEDBACK_LEARNING_RATE = 0.015
export const MIN_RATING_DELTA = -0.06
export const MAX_RATING_DELTA = 0.06

function clampRatingDelta(value: number) {
  return Math.min(MAX_RATING_DELTA, Math.max(MIN_RATING_DELTA, value))
}

function addDelta(delta: Partial<ScoreWeights>, key: ScoreWeightKey, value: number) {
  delta[key] = clampRatingDelta((delta[key] ?? 0) + value)
}

function tagTargets(tag: TodayFeedbackReasonTag): ScoreWeightKey[] {
  const map: Record<TodayFeedbackReasonTag, ScoreWeightKey[]> = {
    like_color: ['colorHarmony'],
    like_silhouette: ['silhouetteBalance'],
    like_layering: ['layering'],
    like_shoes_bag: ['completeness', 'focalPoint'],
    like_scene_fit: ['sceneFit'],
    like_comfort: ['weatherComfort'],
    like_freshness: ['freshness'],
    dislike_color: ['colorHarmony'],
    dislike_silhouette: ['silhouetteBalance'],
    dislike_too_complex: ['layering'],
    dislike_too_plain: ['freshness'],
    dislike_too_bold: ['freshness', 'focalPoint'],
    dislike_shoes: ['completeness', 'focalPoint'],
    dislike_scene_fit: ['sceneFit'],
    dislike_comfort: ['weatherComfort'],
    dislike_item: ['freshness']
  }

  return map[tag]
}

function tagPolarity(tag: TodayFeedbackReasonTag) {
  return tag.startsWith('like_') ? 1 : -1
}

export function getFeedbackRatingSignal(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Feedback rating must be an integer from 1 to 5.')
  }

  return (rating - 3) / 2
}

export function updateRatingDeltaFromFeedback({
  currentRatingDelta = {},
  rating,
  reasonTags
}: {
  currentRatingDelta?: Partial<ScoreWeights>
  rating: number
  reasonTags: TodayFeedbackReasonTag[]
}): Partial<ScoreWeights> {
  const signal = getFeedbackRatingSignal(rating)

  if (signal === 0 && reasonTags.length === 0) {
    return { ...currentRatingDelta }
  }

  const nextDelta: Partial<ScoreWeights> = { ...currentRatingDelta }
  const uniqueTags = [...new Set(reasonTags)]

  if (uniqueTags.length === 0) {
    const fallbackAdjustment = signal * FEEDBACK_LEARNING_RATE * 0.5
    addDelta(nextDelta, 'freshness', fallbackAdjustment)
    addDelta(nextDelta, 'sceneFit', fallbackAdjustment)
    return nextDelta
  }

  for (const tag of uniqueTags) {
    const direction = signal === 0 ? tagPolarity(tag) * 0.5 : signal
    const adjustment = direction * FEEDBACK_LEARNING_RATE
    const targets = tagTargets(tag)

    targets.forEach((target) => addDelta(nextDelta, target, adjustment / targets.length))
  }

  SCORE_WEIGHT_KEYS.forEach((key) => {
    if (nextDelta[key] !== undefined) {
      nextDelta[key] = clampRatingDelta(nextDelta[key])
    }
  })

  return nextDelta
}

export function buildWeightsAfterFeedback({
  defaultWeights,
  questionnaireDelta = {},
  currentRatingDelta = {},
  rating,
  reasonTags
}: {
  defaultWeights: ScoreWeights
  questionnaireDelta?: Partial<ScoreWeights>
  currentRatingDelta?: Partial<ScoreWeights>
  rating: number
  reasonTags: TodayFeedbackReasonTag[]
}) {
  const ratingDelta = updateRatingDeltaFromFeedback({
    currentRatingDelta,
    rating,
    reasonTags
  })

  return {
    ratingDelta,
    finalWeights: buildFinalWeights(defaultWeights, questionnaireDelta, ratingDelta)
  }
}
