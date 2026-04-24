import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'
import { deterministicSeedToUnit, isGoodInspirationCandidate, pickDeterministicInspirationCandidate, shouldShowInspiration } from '@/lib/recommendation/exploration'
import type { PreferenceProfile } from '@/lib/recommendation/preference-types'

function profileWithExploration(overrides: Partial<PreferenceProfile['exploration']> = {}): PreferenceProfile {
  return {
    ...DEFAULT_PREFERENCE_PROFILE,
    exploration: {
      ...DEFAULT_PREFERENCE_PROFILE.exploration,
      ...overrides
    }
  }
}

describe('exploration helpers', () => {
  it('does not show inspiration when exploration rate is 0', () => {
    const profile = profileWithExploration({ enabled: true, rate: 0 })

    expect(shouldShowInspiration({ profile, deterministicValue: 0, candidateCount: 3 })).toBe(false)
  })

  it('uses injected deterministic values instead of random state', () => {
    const profile = profileWithExploration({ rate: 0.1 })

    expect(shouldShowInspiration({ profile, deterministicValue: 0.05 })).toBe(true)
    expect(shouldShowInspiration({ profile, deterministicValue: 0.5 })).toBe(false)
  })

  it('maps deterministic seeds into stable unit values', () => {
    expect(deterministicSeedToUnit('phase-7')).toBe(deterministicSeedToUnit('phase-7'))
    expect(deterministicSeedToUnit('phase-7')).toBeGreaterThanOrEqual(0)
    expect(deterministicSeedToUnit('phase-7')).toBeLessThanOrEqual(1)
  })

  it('rejects inspiration candidates that violate hard avoids or fit guardrails', () => {
    const profile = {
      ...profileWithExploration({ enabled: true, maxDistanceFromDailyStyle: 0.45 }),
      hardAvoids: ['不喜欢高跟鞋']
    }

    expect(isGoodInspirationCandidate({
      id: 'good',
      colorHarmony: 80,
      sceneFit: 80,
      weatherComfort: 80,
      distanceFromDailyStyle: 0.2,
      focalPointCount: 1
    }, profile)).toBe(true)
    expect(isGoodInspirationCandidate({
      id: 'bad-avoid',
      hardAvoidTags: ['高跟鞋'],
      colorHarmony: 80
    }, profile)).toBe(false)
    expect(isGoodInspirationCandidate({
      id: 'bad-distance',
      colorHarmony: 80,
      distanceFromDailyStyle: 0.8
    }, profile)).toBe(false)
    expect(isGoodInspirationCandidate({
      id: 'bad-weather',
      colorHarmony: 80,
      weatherComfort: 30
    }, profile)).toBe(false)
  })

  it('picks a deterministic candidate from valid inspiration options', () => {
    const profile = profileWithExploration({ enabled: true })
    const selected = pickDeterministicInspirationCandidate([
      { id: 'blocked', colorHarmony: 20 },
      { id: 'valid-1', colorHarmony: 80 },
      { id: 'valid-2', colorHarmony: 90 }
    ], profile, 'fixed-seed')

    expect(selected?.id).toMatch(/^valid-/u)
  })
})
