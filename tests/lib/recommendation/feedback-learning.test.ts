import { describe, expect, it } from 'vitest'
import { DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import {
  buildWeightsAfterFeedback,
  MAX_RATING_DELTA,
  MIN_RATING_DELTA,
  updateRatingDeltaFromFeedback
} from '@/lib/recommendation/feedback-learning'
import type { ScoreWeights } from '@/lib/recommendation/preference-types'

describe('updateRatingDeltaFromFeedback', () => {
  it('increases tagged dimensions for positive feedback', () => {
    const delta = updateRatingDeltaFromFeedback({
      rating: 5,
      reasonTags: ['like_color', 'like_scene_fit']
    })

    expect(delta.colorHarmony).toBeGreaterThan(0)
    expect(delta.sceneFit).toBeGreaterThan(0)
  })

  it('decreases tagged dimensions for negative feedback', () => {
    const delta = updateRatingDeltaFromFeedback({
      rating: 1,
      reasonTags: ['dislike_color', 'dislike_scene_fit']
    })

    expect(delta.colorHarmony).toBeLessThan(0)
    expect(delta.sceneFit).toBeLessThan(0)
  })

  it('clamps learned rating deltas per dimension', () => {
    const currentRatingDelta: Partial<ScoreWeights> = {
      colorHarmony: MAX_RATING_DELTA - 0.001,
      sceneFit: MIN_RATING_DELTA + 0.001
    }

    const positive = updateRatingDeltaFromFeedback({
      currentRatingDelta,
      rating: 5,
      reasonTags: ['like_color']
    })
    const negative = updateRatingDeltaFromFeedback({
      currentRatingDelta,
      rating: 1,
      reasonTags: ['dislike_scene_fit']
    })

    expect(positive.colorHarmony).toBe(MAX_RATING_DELTA)
    expect(negative.sceneFit).toBe(MIN_RATING_DELTA)
  })

  it('does not update neutral feedback without reason tags', () => {
    expect(updateRatingDeltaFromFeedback({ rating: 3, reasonTags: [] })).toEqual({})
  })

  it('returns final weights after applying learned deltas', () => {
    const result = buildWeightsAfterFeedback({
      defaultWeights: DEFAULT_RECOMMENDATION_WEIGHTS,
      rating: 5,
      reasonTags: ['like_comfort']
    })

    expect(result.ratingDelta.weatherComfort).toBeGreaterThan(0)
    expect(result.finalWeights.weatherComfort).toBeGreaterThan(DEFAULT_RECOMMENDATION_WEIGHTS.weatherComfort)
  })
})
