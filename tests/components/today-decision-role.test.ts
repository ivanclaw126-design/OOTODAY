import { describe, expect, it } from 'vitest'
import { getTodayDecisionRole } from '@/components/today/today-decision-role'
import type { TodayRecommendation, TodayScene } from '@/lib/today/types'

const recommendation = {
  id: 'rec-1',
  reason: '基础',
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
} satisfies TodayRecommendation

describe('getTodayDecisionRole', () => {
  it('returns default roles for missing scene', () => {
    expect(getTodayDecisionRole({ index: 0, scene: null, recommendation }).label).toBe('最稳妥方案')
    expect(getTodayDecisionRole({ index: 1, scene: null, recommendation }).label).toBe('更精致一点')
    expect(getTodayDecisionRole({ index: 2, scene: null, recommendation }).label).toBe('更轻松一点')
  })

  it.each([
    ['work', ['最稳妥方案', '更正式一点', '更舒适一点']],
    ['casual', ['最稳妥方案', '更轻松一点', '更有变化']],
    ['date', ['更有氛围', '更显比例', '更轻松自然']],
    ['travel', ['最舒服', '最上镜', '最耐走']],
    ['outdoor', ['最实用', '更轻便', '更有层次']]
  ] as Array<[Exclude<TodayScene, null>, string[]]>)('returns scene roles for %s', (scene, labels) => {
    labels.forEach((label, index) => {
      expect(getTodayDecisionRole({ index, scene, recommendation }).label).toBe(label)
    })
  })
})
