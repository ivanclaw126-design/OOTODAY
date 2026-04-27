import { describe, expect, it } from 'vitest'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { scoreRecommendationCandidate, blendModelAndRuleScore } from '@/lib/recommendation/canonical-scoring'
import { RECOMMENDATION_STRATEGY_KEYS } from '@/lib/recommendation/canonical-types'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'

function item(overrides: Partial<ClosetItemCardData>): ClosetItemCardData {
  return {
    id: overrides.id ?? 'item',
    imageUrl: null,
    category: overrides.category ?? '上装',
    subCategory: overrides.subCategory ?? 'T恤',
    colorCategory: overrides.colorCategory ?? '白色',
    styleTags: overrides.styleTags ?? ['基础'],
    seasonTags: overrides.seasonTags,
    algorithmMeta: overrides.algorithmMeta,
    lastWornDate: overrides.lastWornDate ?? null,
    wearCount: overrides.wearCount ?? 0,
    createdAt: overrides.createdAt ?? '2026-04-27T00:00:00Z'
  }
}

describe('canonical recommendation scoring', () => {
  it('returns every md strategy score and the full production score contract', () => {
    const result = scoreRecommendationCandidate({
      id: 'candidate-1',
      surface: 'today',
      outfit: {
        top: item({
          id: 'top',
          subCategory: '短款针织上衣',
          colorCategory: '黑色',
          styleTags: ['通勤', 'classic'],
          algorithmMeta: { warmthLevel: 2, formality: 3, layerRole: 'mid', silhouette: ['短款'] }
        }),
        bottom: item({
          id: 'bottom',
          category: '下装',
          subCategory: '高腰直筒牛仔裤',
          colorCategory: '牛仔蓝',
          styleTags: ['休闲', 'classic'],
          algorithmMeta: { warmthLevel: 2, formality: 3, silhouette: ['高腰', '直筒'] }
        }),
        outerLayer: item({
          id: 'outer',
          category: '外层',
          subCategory: '西装外套',
          colorCategory: '深灰色',
          styleTags: ['通勤', 'classic'],
          algorithmMeta: { warmthLevel: 3, formality: 4, layerRole: 'outer' }
        }),
        shoes: item({
          id: 'shoes',
          category: '鞋履',
          subCategory: '黑色乐福鞋',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          algorithmMeta: { warmthLevel: 2, formality: 4, comfortLevel: 4 }
        }),
        bag: item({
          id: 'bag',
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '深灰色',
          styleTags: ['通勤'],
          algorithmMeta: { formality: 4 }
        }),
        missingSlots: []
      },
      context: {
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          preferredScenes: ['work'],
          colorPreference: {
            ...DEFAULT_PREFERENCE_PROFILE.colorPreference,
            palette: 'tonal',
            accentTolerance: 0
          }
        },
        weather: {
          city: 'Shanghai',
          temperatureC: 15,
          conditionLabel: '阴',
          isWarm: false,
          isCold: false
        },
        trendTags: ['classic']
      }
    })

    expect(Object.keys(result.scoreBreakdown.strategyScores).sort()).toEqual([...RECOMMENDATION_STRATEGY_KEYS].sort())
    expect(Object.keys(result.scoreBreakdown.ruleScores).sort()).toEqual([
      'contextFit',
      'explanationQuality',
      'novelty',
      'outfitStrategy',
      'trendOverlay',
      'userPreference',
      'visualCompatibility',
      'wardrobeRotation',
      'weatherPracticality'
    ])
    expect(Object.keys(result.scoreBreakdown.compatibilityScores).sort()).toEqual([
      'color',
      'formality',
      'material',
      'pattern',
      'scene',
      'shoesBag',
      'silhouette',
      'styleDistance',
      'temperature'
    ])
    expect(result.scoreBreakdown.strategyScores.outfitFormula).toBeGreaterThan(70)
    expect(result.scoreBreakdown.strategyScores.sandwichDressing).toBeGreaterThan(70)
    expect(result.scoreBreakdown.strategyScores.proportionBalance).toBeGreaterThan(70)
    expect(result.scoreBreakdown.totalScore).toBeGreaterThan(50)
  })

  it('keeps hard avoids stronger than model scores', () => {
    const result = scoreRecommendationCandidate({
      id: 'candidate-hard-avoid',
      surface: 'today',
      outfit: {
        top: item({ id: 'top', subCategory: '大logo亮片上衣', colorCategory: '红色', styleTags: ['大logo'] }),
        bottom: item({ id: 'bottom', category: '下装', subCategory: '短裤', colorCategory: '黄色' }),
        missingSlots: ['shoes']
      },
      context: {
        profile: {
          ...DEFAULT_PREFERENCE_PROFILE,
          hardAvoids: ['大logo']
        },
        weather: {
          city: 'Shanghai',
          temperatureC: 8,
          conditionLabel: '冷',
          isWarm: false,
          isCold: true
        }
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

    expect(result.scoreBreakdown.riskFlags).toContain('hardAvoid')
    expect(result.scoreBreakdown.ruleBaselineScore).toBe(0)
    expect(result.scoreBreakdown.modelScores.status).toBe('low_quality')
    expect(result.scoreBreakdown.totalScore).toBe(0)
  })

  it('uses model-dominant blend only when a promoted model score is active', () => {
    expect(blendModelAndRuleScore({
      ruleBaselineScore: 40,
      modelScores: {
        modelRunId: 'run-1',
        xgboostScore: 90,
        lightfmScore: 80,
        implicitScore: 70,
        ruleScore: 40,
        finalScore: 88,
        status: 'active'
      }
    }).totalScore).toBeGreaterThan(80)

    expect(blendModelAndRuleScore({
      ruleBaselineScore: 40,
      modelScores: {
        modelRunId: null,
        xgboostScore: null,
        lightfmScore: null,
        implicitScore: null,
        ruleScore: null,
        finalScore: null,
        status: 'missing'
      }
    }).totalScore).toBe(40)
  })
})
