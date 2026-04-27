import { describe, expect, it } from 'vitest'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'
import type { EvaluatedOutfit } from '@/lib/recommendation/outfit-evaluator'
import { scoreRecommendationStrategies } from '@/lib/recommendation/strategy-scorers'
import type { RecommendationScoringContext, RecommendationStrategyKey } from '@/lib/recommendation/canonical-types'
import { RECOMMENDATION_STRATEGY_KEYS } from '@/lib/recommendation/canonical-types'
import type { PreferenceProfile } from '@/lib/recommendation/preference-types'

type StrategyCase = {
  outfit: EvaluatedOutfit
  context?: RecommendationScoringContext
}

type StrategyCaseSet = {
  positives: [StrategyCase, StrategyCase]
  negative: StrategyCase
  boundary: StrategyCase
  positiveMin?: number
  negativeMax?: number
  boundaryMin?: number
  boundaryMax?: number
}

function item(overrides: Partial<ClosetItemCardData>): ClosetItemCardData {
  return {
    id: overrides.id ?? `${overrides.category ?? '上装'}-${overrides.subCategory ?? 'item'}`,
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

function profile(overrides: Partial<PreferenceProfile> = {}): PreferenceProfile {
  return {
    ...DEFAULT_PREFERENCE_PROFILE,
    ...overrides,
    colorPreference: {
      ...DEFAULT_PREFERENCE_PROFILE.colorPreference,
      ...overrides.colorPreference
    },
    practicalityPreference: {
      ...DEFAULT_PREFERENCE_PROFILE.practicalityPreference,
      ...overrides.practicalityPreference
    },
    exploration: {
      ...DEFAULT_PREFERENCE_PROFILE.exploration,
      ...overrides.exploration
    }
  }
}

function outfit(parts: EvaluatedOutfit): EvaluatedOutfit {
  return {
    missingSlots: [],
    ...parts
  }
}

function top(overrides: Partial<ClosetItemCardData> = {}) {
  return item({ category: '上装', ...overrides })
}

function bottom(overrides: Partial<ClosetItemCardData> = {}) {
  return item({ category: '下装', ...overrides })
}

function outer(overrides: Partial<ClosetItemCardData> = {}) {
  return item({ category: '外层', ...overrides })
}

function shoes(overrides: Partial<ClosetItemCardData> = {}) {
  return item({ category: '鞋履', ...overrides })
}

function bag(overrides: Partial<ClosetItemCardData> = {}) {
  return item({ category: '包袋', ...overrides })
}

function accessory(overrides: Partial<ClosetItemCardData> = {}) {
  return item({ category: '配饰', ...overrides })
}

function score(key: RecommendationStrategyKey, strategyCase: StrategyCase) {
  return scoreRecommendationStrategies(strategyCase.outfit, strategyCase.context).scoreMap[key]
}

const workProfile = profile({ preferredScenes: ['work'] })
const dateProfile = profile({ preferredScenes: ['date'] })
const neutralProfile = profile({ colorPreference: { palette: 'neutral', accentTolerance: 0 } })
const tonalProfile = profile({ colorPreference: { palette: 'tonal' } })
const boldProfile = profile({ colorPreference: { palette: 'boldContrast', accentTolerance: 2 } })

const strategyCases: Record<RecommendationStrategyKey, StrategyCaseSet> = {
  capsuleWardrobe: {
    positives: [
      {
        outfit: outfit({
          top: top({ colorCategory: '白色', styleTags: ['通勤', 'classic'], wearCount: 4 }),
          bottom: bottom({ colorCategory: '黑色', styleTags: ['通勤', 'classic'], wearCount: 3 }),
          shoes: shoes({ colorCategory: '黑色', styleTags: ['通勤'], wearCount: 5 })
        })
      },
      {
        outfit: outfit({
          top: top({ colorCategory: '米色', styleTags: ['休闲', 'minimal'], wearCount: 2 }),
          bottom: bottom({ colorCategory: '深灰色', styleTags: ['休闲', 'minimal'], wearCount: 2 }),
          bag: bag({ colorCategory: '黑色', styleTags: ['minimal'], wearCount: 1 })
        })
      }
    ],
    negative: {
      outfit: outfit({
        top: top({ colorCategory: '红色', styleTags: ['派对'] }),
        bottom: bottom({ colorCategory: '黄色', styleTags: ['户外'] }),
        shoes: shoes({ colorCategory: '蓝色', styleTags: ['运动'] })
      })
    },
    boundary: {
      outfit: outfit({
        top: top({ colorCategory: '白色', styleTags: ['基础'] }),
        bottom: bottom({ colorCategory: '红色', styleTags: ['派对'] })
      })
    }
  },
  outfitFormula: {
    positives: [
      { outfit: outfit({ top: top(), bottom: bottom(), shoes: shoes() }) },
      { outfit: outfit({ dress: item({ category: '连体/全身装', subCategory: '连衣裙' }), shoes: shoes() }) }
    ],
    negative: { outfit: outfit({ top: top() }) },
    boundary: { outfit: outfit({ top: top(), bottom: bottom() }) }
  },
  threeWordStyle: {
    positives: [
      {
        outfit: outfit({
          top: top({ subCategory: '商务衬衫', styleTags: ['通勤', 'classic'] }),
          bottom: bottom({ subCategory: '正式西裤', styleTags: ['商务'] })
        }),
        context: { profile: workProfile }
      },
      {
        outfit: outfit({
          top: top({ subCategory: '优雅针织', styleTags: ['约会', 'romantic'] }),
          bag: bag({ subCategory: '小包', styleTags: ['约会'] })
        }),
        context: { profile: dateProfile }
      }
    ],
    negative: { outfit: outfit({ top: top({ styleTags: ['户外'] }) }), context: { profile: workProfile } },
    boundary: { outfit: outfit({ top: top({ styleTags: ['通勤'] }) }), context: { profile: workProfile } }
  },
  personalColorPalette: {
    positives: [
      {
        outfit: outfit({ top: top({ colorCategory: '白色' }), bottom: bottom({ colorCategory: '黑色' }) }),
        context: { profile: neutralProfile }
      },
      {
        outfit: outfit({ top: top({ colorCategory: '浅灰色' }), bottom: bottom({ colorCategory: '深灰色' }) }),
        context: { profile: tonalProfile }
      }
    ],
    negative: {
      outfit: outfit({ top: top({ colorCategory: '红色' }), bottom: bottom({ colorCategory: '黄色' }) }),
      context: { profile: neutralProfile }
    },
    boundary: {
      outfit: outfit({ top: top({ colorCategory: '白色' }), bottom: bottom({ colorCategory: '黑色' }) }),
      context: { profile: boldProfile }
    }
  },
  sandwichDressing: {
    positives: [
      {
        outfit: outfit({
          top: top({ colorCategory: '黑色' }),
          bottom: bottom({ colorCategory: '蓝色' }),
          shoes: shoes({ colorCategory: '黑色' })
        })
      },
      {
        outfit: outfit({
          top: top({ algorithmMeta: { fabricWeight: 'medium' } }),
          bottom: bottom({ colorCategory: '蓝色' }),
          bag: bag({ algorithmMeta: { fabricWeight: 'medium' } })
        })
      }
    ],
    negative: { outfit: outfit({ top: top(), bottom: bottom() }) },
    boundary: { outfit: outfit({ top: top({ colorCategory: '白色' }), shoes: shoes({ colorCategory: '红色' }) }) }
  },
  wrongShoeTheory: {
    positives: [
      {
        outfit: outfit({
          top: top({ subCategory: '商务衬衫', algorithmMeta: { formality: 4 } }),
          bottom: bottom({ subCategory: '正式西裤', algorithmMeta: { formality: 4 } }),
          shoes: shoes({ subCategory: '舒适运动鞋', algorithmMeta: { formality: 2, comfortLevel: 4, warmthLevel: 2 } })
        })
      },
      {
        outfit: outfit({
          top: top({ subCategory: '休闲T恤', algorithmMeta: { formality: 2 } }),
          bottom: bottom({ subCategory: '牛仔裤', algorithmMeta: { formality: 2 } }),
          shoes: shoes({ subCategory: '黑色乐福鞋', algorithmMeta: { formality: 4, comfortLevel: 4, warmthLevel: 2 } })
        })
      }
    ],
    negative: {
      outfit: outfit({
        top: top({ algorithmMeta: { formality: 5 } }),
        shoes: shoes({ subCategory: '拖鞋', algorithmMeta: { formality: 1, comfortLevel: 2 } })
      })
    },
    boundary: {
      outfit: outfit({
        top: top({ algorithmMeta: { formality: 3 } }),
        shoes: shoes({ algorithmMeta: { formality: 3, comfortLevel: 4 } })
      })
    }
  },
  twoThirdRule: {
    positives: [
      {
        outfit: outfit({
          top: top({ subCategory: '舒适针织衫', algorithmMeta: { comfortLevel: 4 } }),
          bottom: bottom({ subCategory: '基础西裤', algorithmMeta: { comfortLevel: 4 } }),
          bag: bag({ subCategory: '托特包', algorithmMeta: { formality: 4 } })
        }),
        context: { effortLevel: 'low' }
      },
      {
        outfit: outfit({
          top: top({ subCategory: '免烫衬衫', algorithmMeta: { comfortLevel: 4 } }),
          shoes: shoes({ subCategory: '乐福鞋', algorithmMeta: { formality: 4 } })
        }),
        context: { effortLevel: 'low' }
      }
    ],
    negative: { outfit: outfit({ top: top({ subCategory: '紧身亮片上衣', algorithmMeta: { comfortLevel: 1 } }) }) },
    boundary: { outfit: outfit({ top: top({ subCategory: '基础T恤', algorithmMeta: { comfortLevel: 4 } }) }) }
  },
  proportionBalance: {
    positives: [
      { outfit: outfit({ dress: item({ category: '连体/全身装', subCategory: '收腰连衣裙' }) }) },
      {
        outfit: outfit({
          top: top({ subCategory: '短款针织', algorithmMeta: { silhouette: ['短款'], visualWeight: 2 } }),
          bottom: bottom({ subCategory: '高腰直筒裤', algorithmMeta: { silhouette: ['高腰', '直筒'], visualWeight: 3 } })
        })
      }
    ],
    negative: {
      outfit: outfit({
        top: top({ subCategory: '超宽松上衣', algorithmMeta: { visualWeight: 5 } }),
        bottom: bottom({ subCategory: '蓬蓬半裙', algorithmMeta: { visualWeight: 1 } })
      })
    },
    boundary: {
      outfit: outfit({
        top: top({ subCategory: '普通衬衫', algorithmMeta: { visualWeight: 3 } }),
        bottom: bottom({ subCategory: '普通长裤', algorithmMeta: { visualWeight: 3 } })
      })
    }
  },
  layering: {
    positives: [
      { outfit: outfit({ top: top(), outerLayer: outer({ algorithmMeta: { layerRole: 'outer', warmthLevel: 3 } }) }) },
      {
        outfit: outfit({ top: top(), outerLayer: outer({ algorithmMeta: { layerRole: 'outer', warmthLevel: 4 } }) }),
        context: { weather: { city: 'Shanghai', temperatureC: 7, conditionLabel: '冷', isWarm: false, isCold: true } }
      }
    ],
    negative: {
      outfit: outfit({ top: top({ algorithmMeta: { warmthLevel: 1 } }) }),
      context: { weather: { city: 'Shanghai', temperatureC: 6, conditionLabel: '冷', isWarm: false, isCold: true } }
    },
    boundary: { outfit: outfit({ top: top() }) }
  },
  tonalDressing: {
    positives: [
      { outfit: outfit({ top: top({ colorCategory: '浅灰色' }), bottom: bottom({ colorCategory: '深灰色' }) }) },
      { outfit: outfit({ top: top({ colorCategory: '米色' }), bottom: bottom({ colorCategory: '驼色' }) }) }
    ],
    negative: {
      outfit: outfit({
        top: top({ colorCategory: '红色' }),
        bottom: bottom({ colorCategory: '黄色' }),
        shoes: shoes({ colorCategory: '蓝色' })
      })
    },
    boundary: { outfit: outfit({ top: top({ colorCategory: '红色' }), bottom: bottom({ colorCategory: '黄色' }) }) }
  },
  occasionNiche: {
    positives: [
      {
        outfit: outfit({
          top: top({ subCategory: '商务衬衫', styleTags: ['通勤'], algorithmMeta: { formality: 4 } }),
          bottom: bottom({ subCategory: '西裤', styleTags: ['商务'], algorithmMeta: { formality: 4 } })
        }),
        context: { profile: workProfile }
      },
      {
        outfit: outfit({
          top: top({ subCategory: '舒适防皱上衣', styleTags: ['旅行'], algorithmMeta: { comfortLevel: 4 } }),
          shoes: shoes({ subCategory: '舒适运动鞋', styleTags: ['旅行'], algorithmMeta: { comfortLevel: 4 } })
        }),
        context: { profile: profile({ preferredScenes: ['travel'] }) }
      }
    ],
    negative: {
      outfit: outfit({ top: top({ subCategory: '运动背心', styleTags: ['运动'], algorithmMeta: { formality: 1 } }) }),
      context: { profile: workProfile }
    },
    boundary: {
      outfit: outfit({ top: top({ subCategory: '正式西装', styleTags: [], algorithmMeta: { formality: 4 } }) }),
      context: { profile: profile({ preferredScenes: ['casual'] }) }
    }
  },
  pinterestRecreation: {
    positives: [
      {
        outfit: outfit({
          top: top({ styleTags: ['复古'] }),
          bottom: bottom({ styleTags: ['复古'] }),
          shoes: shoes(),
          bag: bag()
        }),
        context: { inspirationTags: ['复古'] }
      },
      {
        outfit: outfit({
          dress: item({ category: '连体/全身装', styleTags: ['法式'] }),
          shoes: shoes(),
          accessories: [accessory({ styleTags: ['法式'] })]
        }),
        context: { inspirationTags: ['法式'] }
      }
    ],
    negative: { outfit: outfit({}), context: { inspirationTags: ['复古', '通勤'] } },
    boundary: { outfit: outfit({ top: top({ styleTags: ['基础'] }) }) }
  },
  trendOverlay: {
    positives: [
      { outfit: outfit({ top: top({ subCategory: '蕾丝蓝色上衣' }) }), context: { trendTags: ['蕾丝', '蓝色'] } },
      { outfit: outfit({ outerLayer: outer({ subCategory: '垫肩西装' }) }), context: { trendTags: ['垫肩'] } }
    ],
    negative: { outfit: outfit({ top: top({ subCategory: '基础白T' }) }), context: { trendTags: ['蕾丝'] } },
    boundary: {
      outfit: outfit({ top: top({ subCategory: '蓝色衬衫' }) }),
      context: { trendTags: ['蓝色'], profile: profile({ exploration: { rate: 0.02 } }) }
    }
  }
}

describe('md strategy scorers', () => {
  for (const key of RECOMMENDATION_STRATEGY_KEYS) {
    it(`${key} covers mature positive, negative, and boundary examples`, () => {
      const strategyCase = strategyCases[key]
      const positiveMin = strategyCase.positiveMin ?? 72
      const negativeMax = strategyCase.negativeMax ?? 71
      const boundaryMin = strategyCase.boundaryMin ?? 40
      const boundaryMax = strategyCase.boundaryMax ?? 71

      expect(score(key, strategyCase.positives[0])).toBeGreaterThanOrEqual(positiveMin)
      expect(score(key, strategyCase.positives[1])).toBeGreaterThanOrEqual(positiveMin)
      expect(score(key, strategyCase.negative)).toBeLessThanOrEqual(negativeMax)
      expect(score(key, strategyCase.boundary)).toBeGreaterThanOrEqual(boundaryMin)
      expect(score(key, strategyCase.boundary)).toBeLessThanOrEqual(boundaryMax)
    })
  }
})
