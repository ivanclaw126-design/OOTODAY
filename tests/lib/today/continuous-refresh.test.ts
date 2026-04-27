import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'
import {
  getContinuationInspirationInterval,
  getNextContinuationMode,
  mergeContinuousRecommendations
} from '@/lib/today/continuous-refresh'
import type { TodayRecommendation } from '@/lib/today/types'

function recommendation(id: string): TodayRecommendation {
  return {
    id,
    reason: id,
    top: null,
    bottom: null,
    dress: null,
    outerLayer: null,
    shoes: null,
    bag: null,
    accessories: [],
    missingSlots: [],
    confidence: 80,
    componentScores: {
      colorHarmony: 80,
      silhouetteBalance: 80,
      layering: 80,
      focalPoint: 80,
      sceneFit: 80,
      weatherComfort: 80,
      completeness: 80,
      freshness: 80
    },
    mode: 'daily'
  }
}

describe('continuous Today refresh', () => {
  it('keeps the visible cards resident when appending a new one', () => {
    const merged = mergeContinuousRecommendations({
      currentRecommendations: [recommendation('rec-1'), recommendation('rec-2'), recommendation('rec-3')],
      newRecommendation: recommendation('rec-4'),
      recordedRecommendationId: null
    })

    expect(merged.map((item) => item.id)).toEqual(['rec-1', 'rec-2', 'rec-3', 'rec-4'])
  })

  it('preserves a worn recommendation while appending the next card', () => {
    const merged = mergeContinuousRecommendations({
      currentRecommendations: [recommendation('locked'), recommendation('rec-2'), recommendation('rec-3')],
      newRecommendation: recommendation('rec-4'),
      recordedRecommendationId: 'locked'
    })

    expect(merged.map((item) => item.id)).toEqual(['locked', 'rec-2', 'rec-3', 'rec-4'])
  })

  it('keeps scroll order stable when the worn recommendation is in the middle or at the end', () => {
    const middle = mergeContinuousRecommendations({
      currentRecommendations: [recommendation('rec-1'), recommendation('locked'), recommendation('rec-3')],
      newRecommendation: recommendation('rec-4'),
      recordedRecommendationId: 'locked'
    })
    const end = mergeContinuousRecommendations({
      currentRecommendations: [recommendation('rec-1'), recommendation('rec-2'), recommendation('locked')],
      newRecommendation: recommendation('rec-4'),
      recordedRecommendationId: 'locked'
    })

    expect(middle.map((item) => item.id)).toEqual(['rec-1', 'locked', 'rec-3', 'rec-4'])
    expect(end.map((item) => item.id)).toEqual(['rec-1', 'rec-2', 'locked', 'rec-4'])
  })

  it('keeps inspiration cadence between 3 and 10 refreshes and follows exploration willingness', () => {
    const stableInterval = getContinuationInspirationInterval({ explorationRate: 0.02, refreshCount: 2 })
    const boldInterval = getContinuationInspirationInterval({ explorationRate: 0.14, refreshCount: 2 })

    expect(stableInterval).toBeGreaterThanOrEqual(3)
    expect(stableInterval).toBeLessThanOrEqual(10)
    expect(boldInterval).toBeGreaterThanOrEqual(3)
    expect(boldInterval).toBeLessThanOrEqual(10)
    expect(boldInterval).toBeLessThan(stableInterval)
  })

  it('returns daily when exploration is disabled and inspiration when the deterministic interval lands', () => {
    expect(getNextContinuationMode({
      refreshCount: 9,
      exploration: {
        ...DEFAULT_PREFERENCE_PROFILE.exploration,
        enabled: false,
        rate: 0.14
      }
    })).toBe('daily')

    expect(getNextContinuationMode({
      refreshCount: 2,
      exploration: {
        ...DEFAULT_PREFERENCE_PROFILE.exploration,
        enabled: true,
        rate: 0.14
      }
    })).toBe('inspiration')
  })
})
