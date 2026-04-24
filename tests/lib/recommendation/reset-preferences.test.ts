import { describe, expect, it } from 'vitest'
import { sumScoreWeights } from '@/lib/recommendation/build-final-weights'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'

describe('resetRecommendationPreferences', () => {
  it('returns a default preference state with empty learned deltas', () => {
    const now = new Date('2026-04-24T08:00:00.000Z')
    const state = resetRecommendationPreferences(now)

    expect(state.version).toBe(now.getTime())
    expect(state.source).toBe('default')
    expect(state.defaultWeights).toEqual(DEFAULT_RECOMMENDATION_WEIGHTS)
    expect(state.questionnaireDelta).toEqual({})
    expect(state.ratingDelta).toEqual({})
    expect(state.profile).toEqual(DEFAULT_PREFERENCE_PROFILE)
    expect(sumScoreWeights(state.finalWeights)).toBeCloseTo(1, 6)
    expect(state.createdAt).toBe('2026-04-24T08:00:00.000Z')
    expect(state.updatedAt).toBe('2026-04-24T08:00:00.000Z')
  })

  it('returns cloned defaults so callers cannot mutate shared constants', () => {
    const state = resetRecommendationPreferences()

    state.profile.hardAvoids.push('不喜欢帽子')
    state.defaultWeights.colorHarmony = 0

    expect(DEFAULT_PREFERENCE_PROFILE.hardAvoids).toEqual([])
    expect(DEFAULT_RECOMMENDATION_WEIGHTS.colorHarmony).toBe(0.18)
  })
})
