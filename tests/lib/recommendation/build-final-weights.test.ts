import { describe, expect, it } from 'vitest'
import { buildFinalWeights, MAX_SCORE_WEIGHT, MIN_SCORE_WEIGHT, sumScoreWeights } from '@/lib/recommendation/build-final-weights'
import { DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { SCORE_WEIGHT_KEYS, type ScoreWeights } from '@/lib/recommendation/preference-types'

describe('buildFinalWeights', () => {
  it('combines default, questionnaire, and rating deltas then normalizes to 1', () => {
    const result = buildFinalWeights(
      DEFAULT_RECOMMENDATION_WEIGHTS,
      { colorHarmony: 0.03, freshness: -0.02 },
      { colorHarmony: 0.015, sceneFit: 0.015 }
    )

    expect(sumScoreWeights(result)).toBeCloseTo(1, 6)
    expect(result.colorHarmony).toBeGreaterThan(DEFAULT_RECOMMENDATION_WEIGHTS.colorHarmony)
    expect(result.sceneFit).toBeGreaterThan(DEFAULT_RECOMMENDATION_WEIGHTS.sceneFit)
  })

  it('clamps extreme dimensions while keeping a normalized bounded distribution', () => {
    const extremeBase = SCORE_WEIGHT_KEYS.reduce((weights, key) => {
      weights[key] = key === 'colorHarmony' ? 10 : -10
      return weights
    }, {} as ScoreWeights)

    const result = buildFinalWeights(extremeBase)

    expect(sumScoreWeights(result)).toBeCloseTo(1, 6)
    SCORE_WEIGHT_KEYS.forEach((key) => {
      expect(result[key]).toBeGreaterThanOrEqual(MIN_SCORE_WEIGHT)
      expect(result[key]).toBeLessThanOrEqual(MAX_SCORE_WEIGHT)
    })
  })

  it('does not mutate input objects', () => {
    const base = { ...DEFAULT_RECOMMENDATION_WEIGHTS }
    const questionnaireDelta = { colorHarmony: 0.04 }
    const ratingDelta = { colorHarmony: -0.01 }

    buildFinalWeights(base, questionnaireDelta, ratingDelta)

    expect(base).toEqual(DEFAULT_RECOMMENDATION_WEIGHTS)
    expect(questionnaireDelta).toEqual({ colorHarmony: 0.04 })
    expect(ratingDelta).toEqual({ colorHarmony: -0.01 })
  })
})
