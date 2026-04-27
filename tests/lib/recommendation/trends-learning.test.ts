import { describe, expect, it } from 'vitest'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { scoreRecommendationCandidate } from '@/lib/recommendation/canonical-scoring'
import {
  buildInteractionLearningSignals,
  getLearningSignalScoreAdjustment
} from '@/lib/recommendation/learning-signals'
import { normalizeRecommendationTrendRows } from '@/lib/recommendation/trends'

function item(overrides: Partial<ClosetItemCardData>): ClosetItemCardData {
  return {
    id: overrides.id ?? 'item',
    imageUrl: null,
    category: overrides.category ?? '上装',
    subCategory: overrides.subCategory ?? '蕾丝蓝色上衣',
    colorCategory: overrides.colorCategory ?? '蓝色',
    styleTags: overrides.styleTags ?? ['通勤'],
    seasonTags: overrides.seasonTags,
    algorithmMeta: overrides.algorithmMeta,
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-27T00:00:00Z'
  }
}

describe('recommendation trends and learning signals', () => {
  it('normalizes active trend rows with decay and falls back only when rows are empty', () => {
    const signals = normalizeRecommendationTrendRows([
      {
        tag: 'lace',
        source: 'editorial',
        aliases: ['蕾丝'],
        start_date: '2026-04-01',
        end_date: null,
        weight: 1,
        decay_rate: 0.01,
        applicable_scenes: ['date'],
        applicable_styles: ['浪漫'],
        status: 'active'
      }
    ], new Date('2026-04-11T00:00:00Z'))

    expect(signals).toHaveLength(1)
    expect(signals[0]?.activeWeight).toBeLessThan(1)
    expect(normalizeRecommendationTrendRows([], new Date())).not.toHaveLength(0)
  })

  it('keeps skipped as weak learning and hidden item as a hard scoring block', () => {
    const skippedSignals = buildInteractionLearningSignals({
      surface: 'today',
      eventType: 'skipped',
      itemIds: ['top-1', 'bottom-1']
    })
    const hiddenSignals = buildInteractionLearningSignals({
      surface: 'today',
      eventType: 'hidden_item',
      itemIds: ['top-1']
    })
    const outfit = {
      top: item({ id: 'top-1' }),
      bottom: item({ id: 'bottom-1', category: '下装', subCategory: '西裤', colorCategory: '黑色' }),
      missingSlots: []
    }

    expect(getLearningSignalScoreAdjustment({
      outfit,
      signals: skippedSignals,
      contextKeys: ['today']
    })).toBeGreaterThan(-2)

    const result = scoreRecommendationCandidate({
      id: 'hidden-candidate',
      surface: 'today',
      outfit,
      context: {
        learningSignals: hiddenSignals
      }
    }, {
      modelRunId: 'run-1',
      xgboostScore: 99,
      lightfmScore: 99,
      implicitScore: 99,
      ruleScore: 99,
      finalScore: 99,
      status: 'active'
    })

    expect(result.scoreBreakdown.riskFlags).toContain('hiddenItem')
    expect(result.scoreBreakdown.modelScores.status).toBe('low_quality')
    expect(result.scoreBreakdown.totalScore).toBe(0)
  })
})
