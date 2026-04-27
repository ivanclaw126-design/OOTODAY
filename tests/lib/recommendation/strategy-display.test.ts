import { describe, expect, it } from 'vitest'
import {
  RECOMMENDATION_STRATEGY_KEYS,
  type RecommendationStrategyScores
} from '@/lib/recommendation/canonical-types'
import {
  buildRecommendationStrategyRows,
  getRecommendationStrategyDisplayList
} from '@/lib/recommendation/strategy-display'

function strategyScores(overrides: Partial<RecommendationStrategyScores> = {}): RecommendationStrategyScores {
  return Object.fromEntries(
    RECOMMENDATION_STRATEGY_KEYS.map((key) => [key, overrides[key] ?? 55])
  ) as RecommendationStrategyScores
}

describe('strategy display metadata', () => {
  it('covers every recommendation strategy key with user-facing copy and a visual type', () => {
    const displayList = getRecommendationStrategyDisplayList()

    expect(displayList.map((item) => item.key)).toEqual([...RECOMMENDATION_STRATEGY_KEYS])
    expect(displayList).toHaveLength(13)

    for (const item of displayList) {
      expect(item.name).toBeTruthy()
      expect(item.shortLabel).toBeTruthy()
      expect(item.meaning).toBeTruthy()
      expect(item.core).toBeTruthy()
      expect(item.visualType).toBeTruthy()
    }

    expect(new Set(displayList.map((item) => item.visualType)).size).toBe(13)
  })

  it('sorts strategy rows by score and marks primary, supporting, and weak signals', () => {
    const rows = buildRecommendationStrategyRows(strategyScores({
      outfitFormula: 94,
      capsuleWardrobe: 86,
      trendOverlay: 42
    }))

    expect(rows).toHaveLength(13)
    expect(rows[0]).toMatchObject({
      key: 'outfitFormula',
      score: 94,
      rank: 1,
      level: 'primary'
    })
    expect(rows.find((row) => row.key === 'capsuleWardrobe')?.level).toBe('supporting')
    expect(rows.find((row) => row.key === 'trendOverlay')?.level).toBe('weak')
  })

  it('returns no rows when a recommendation has no strategy scores yet', () => {
    expect(buildRecommendationStrategyRows(null)).toEqual([])
  })
})
