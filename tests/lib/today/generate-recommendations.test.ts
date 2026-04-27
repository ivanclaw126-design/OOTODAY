import { describe, expect, it } from 'vitest'
import { RECOMMENDATION_STRATEGY_KEYS } from '@/lib/recommendation/canonical-types'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'

const items = [
  {
    id: 'top-1',
    imageUrl: 'https://example.com/top-1.jpg',
    category: '上衣',
    subCategory: '针织衫',
    colorCategory: '米色',
    styleTags: ['通勤'],
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-19T10:00:00Z'
  },
  {
    id: 'top-2',
    imageUrl: 'https://example.com/top-2.jpg',
    category: '上衣',
    subCategory: 'T恤',
    colorCategory: '白色',
    styleTags: ['极简'],
    lastWornDate: '2026-04-21',
    wearCount: 3,
    createdAt: '2026-04-19T10:01:00Z'
  },
  {
    id: 'bottom-1',
    imageUrl: 'https://example.com/bottom-1.jpg',
    category: '裤装',
    subCategory: '西裤',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    lastWornDate: null,
    wearCount: 1,
    createdAt: '2026-04-19T10:02:00Z'
  },
  {
    id: 'bottom-2',
    imageUrl: 'https://example.com/bottom-2.jpg',
    category: '裙装',
    subCategory: '半裙',
    colorCategory: '灰色',
    styleTags: ['极简'],
    lastWornDate: '2026-04-20',
    wearCount: 2,
    createdAt: '2026-04-19T10:03:00Z'
  },
  {
    id: 'dress-1',
    imageUrl: 'https://example.com/dress-1.jpg',
    category: '连衣裙',
    subCategory: '针织连衣裙',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    lastWornDate: '2026-04-18',
    wearCount: 4,
    createdAt: '2026-04-19T10:04:00Z'
  },
  {
    id: 'outer-1',
    imageUrl: 'https://example.com/outer-1.jpg',
    category: '外套',
    subCategory: '西装外套',
    colorCategory: '藏蓝',
    styleTags: ['通勤'],
    lastWornDate: '2026-04-15',
    wearCount: 1,
    createdAt: '2026-04-19T10:05:00Z'
  }
]

describe('generateTodayRecommendations', () => {
  it('returns 3 valid recommendations from the object-parameter API', () => {
    const recommendations = generateTodayRecommendations({ items, weather: null })

    expect(recommendations).toHaveLength(3)
    expect(recommendations[0]?.reason).toBeTruthy()
    expect(
      recommendations.every((recommendation) => recommendation.top || recommendation.dress)
    ).toBe(true)
  })

  it('adds first-class outfit formula candidates with deterministic formula metadata', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'formula-top',
          imageUrl: null,
          category: '上装',
          subCategory: '针织衫',
          colorCategory: '米色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'formula-bottom',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      weather: null,
      preferenceState: resetRecommendationPreferences()
    })

    expect(recommendations.some((recommendation) => recommendation.formulaId === 'work-knit-trouser-loafer')).toBe(true)
    expect(recommendations.some((recommendation) => recommendation.recallSource === 'formula')).toBe(true)
  })

  it('uses promoted entity scores to seed extra model-recalled candidates', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'seed-top',
          imageUrl: null,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-20',
          wearCount: 8,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'seed-bottom',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      weather: null,
      entityModelScoreMap: {
        'seed-top': {
          modelRunId: 'run-1',
          lightfmScore: 98,
          implicitScore: 96,
          finalScore: 98,
          status: 'active',
          metadata: {}
        }
      },
      modelScoreMap: {
        'model-seed-seed-top-seed-bottom': {
          modelRunId: 'run-1',
          xgboostScore: 99,
          lightfmScore: 98,
          implicitScore: 97,
          ruleScore: 60,
          finalScore: 99,
          status: 'active'
        }
      }
    })

    expect(recommendations[0]?.id).toBe('model-seed-seed-top-seed-bottom')
    expect(recommendations[0]?.recallSource).toBe('model_seed')
  })

  it('uses the temporary Today scene instead of mutating long-term preference scenes', () => {
    const sceneItems = [
      {
        id: 'work-top',
        imageUrl: null,
        category: '上装',
        subCategory: '针织衫',
        colorCategory: '米色',
        styleTags: ['通勤'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-19T10:00:00Z'
      },
      {
        id: 'work-bottom',
        imageUrl: null,
        category: '下装',
        subCategory: '西裤',
        colorCategory: '黑色',
        styleTags: ['通勤'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-19T10:01:00Z'
      },
      {
        id: 'outdoor-top',
        imageUrl: null,
        category: '上装',
        subCategory: '卫衣',
        colorCategory: '深灰色',
        styleTags: ['户外', '运动'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-19T10:02:00Z'
      },
      {
        id: 'outdoor-bottom',
        imageUrl: null,
        category: '下装',
        subCategory: '休闲裤',
        colorCategory: '卡其色',
        styleTags: ['户外', '运动'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-19T10:03:00Z'
      }
    ]

    const workRecommendations = generateTodayRecommendations({
      items: sceneItems,
      weather: null,
      scene: 'work',
      targetDate: 'tomorrow',
      preferenceState: resetRecommendationPreferences()
    })
    const outdoorRecommendations = generateTodayRecommendations({
      items: sceneItems,
      weather: null,
      scene: 'outdoor',
      targetDate: 'tomorrow',
      preferenceState: resetRecommendationPreferences()
    })

    expect(workRecommendations[0]?.top?.id).toBe('work-top')
    expect(workRecommendations[0]?.bottom?.id).toBe('work-bottom')
    expect(workRecommendations[0]?.scene).toBe('work')
    expect(workRecommendations[0]?.targetDate).toBe('tomorrow')
    expect(outdoorRecommendations[0]?.top?.id).toBe('outdoor-top')
    expect(outdoorRecommendations[0]?.bottom?.id).toBe('outdoor-bottom')
    expect(outdoorRecommendations[0]?.scene).toBe('outdoor')
  })

  it('explains recommendation reasons through scored highlights instead of repeated boilerplate', () => {
    const sameFamilyRecommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-blue',
          imageUrl: 'https://example.com/top-blue.jpg',
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '浅蓝色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-navy',
          imageUrl: 'https://example.com/bottom-navy.jpg',
          category: '下装',
          subCategory: '西裤',
          colorCategory: '藏蓝色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'top-white',
          imageUrl: 'https://example.com/top-white.jpg',
          category: '上装',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-21',
          wearCount: 2,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'bottom-black',
          imageUrl: 'https://example.com/bottom-black.jpg',
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-20',
          wearCount: 1,
          createdAt: '2026-04-19T10:03:00Z'
        }
      ],
      weather: null
    })

    const neutralAnchorRecommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-red',
          imageUrl: 'https://example.com/top-red.jpg',
          category: '上装',
          subCategory: '针织衫',
          colorCategory: '红色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-21',
          wearCount: 3,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-black',
          imageUrl: 'https://example.com/bottom-black.jpg',
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      weather: null
    })

    expect(sameFamilyRecommendations.some((recommendation) => /配色 \d+：/u.test(recommendation.reason))).toBe(true)
    expect(neutralAnchorRecommendations.some((recommendation) => /配色 \d+：/u.test(recommendation.reason))).toBe(true)
    expect(neutralAnchorRecommendations.some((recommendation) => /视觉重点 \d+：|完整度 \d+：/u.test(recommendation.reason))).toBe(true)
    expect(sameFamilyRecommendations[0]?.reasonHighlights?.length).toBeGreaterThan(0)
    expect(sameFamilyRecommendations[0]?.reasonHighlights?.length).toBeLessThanOrEqual(3)
  })

  it('adds outer layers in cold weather when available', () => {
    const recommendations = generateTodayRecommendations({
      items,
      weather: {
        city: 'Shanghai',
        temperatureC: 7,
        conditionLabel: 'light rain',
        isWarm: false,
        isCold: true
      },
      preferenceState: resetRecommendationPreferences()
    })

    expect(recommendations.some((recommendation) => recommendation.outerLayer)).toBe(true)
  })

  it('adds light outer layers in mild cool weather', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-mild',
          imageUrl: null,
          category: '上装',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-mild',
          imageUrl: null,
          category: '下装',
          subCategory: '休闲裤',
          colorCategory: '黑色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'outer-light',
          imageUrl: null,
          category: '外层',
          subCategory: '开衫',
          colorCategory: '浅灰色',
          styleTags: ['休闲', '轻薄'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'outer-heavy',
          imageUrl: null,
          category: '外层',
          subCategory: '大衣',
          colorCategory: '黑色',
          styleTags: ['保暖'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:03:00Z'
        }
      ],
      weather: {
        city: 'Shanghai',
        temperatureC: 16,
        conditionLabel: '晴',
        isWarm: false,
        isCold: false
      },
      preferenceState: resetRecommendationPreferences()
    })

    expect(recommendations[0]?.outerLayer?.id).toBe('outer-light')
    expect(recommendations[0]?.reason).toContain('层次')
    expect(recommendations[0]?.reason).toContain('开衫')
    expect(recommendations[0]?.componentScores?.weatherComfort).toBeGreaterThan(80)
  })

  it('does not pick shorts or sandals at 15 degrees when covered alternatives exist', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'tee',
          imageUrl: null,
          category: '上装',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'shorts',
          imageUrl: null,
          category: '下装',
          subCategory: '短裤',
          colorCategory: '卡其色',
          styleTags: ['休闲'],
          seasonTags: ['夏'],
          algorithmMeta: { warmthLevel: 0, length: '短款' },
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'pants',
          imageUrl: null,
          category: '下装',
          subCategory: '休闲裤',
          colorCategory: '卡其色',
          styleTags: ['休闲'],
          seasonTags: ['春秋'],
          algorithmMeta: { warmthLevel: 2, length: '长款' },
          lastWornDate: '2026-04-20',
          wearCount: 1,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'jacket',
          imageUrl: null,
          category: '外层',
          subCategory: '夹克',
          colorCategory: '黑色',
          styleTags: ['休闲'],
          algorithmMeta: { warmthLevel: 3, layerRole: 'outer' },
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:03:00Z'
        },
        {
          id: 'sandals',
          imageUrl: null,
          category: '鞋履',
          subCategory: '凉鞋/拖鞋',
          colorCategory: '黑色',
          styleTags: ['休闲'],
          seasonTags: ['夏'],
          algorithmMeta: { warmthLevel: 0 },
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:04:00Z'
        },
        {
          id: 'sneakers',
          imageUrl: null,
          category: '鞋履',
          subCategory: '运动鞋',
          colorCategory: '白色',
          styleTags: ['舒适', '休闲'],
          algorithmMeta: { warmthLevel: 2, comfortLevel: 5 },
          lastWornDate: '2026-04-20',
          wearCount: 1,
          createdAt: '2026-04-19T10:05:00Z'
        }
      ],
      weather: {
        city: 'Shanghai',
        temperatureC: 15,
        conditionLabel: '阴',
        isWarm: false,
        isCold: false
      },
      preferenceState: resetRecommendationPreferences()
    })

    expect(recommendations[0]?.bottom?.id).toBe('pants')
    expect(recommendations[0]?.shoes?.id).toBe('sneakers')
    expect(recommendations[0]?.bottom?.id).not.toBe('shorts')
    expect(recommendations[0]?.shoes?.id).not.toBe('sandals')
  })

  it('adds shoes, bag, accessories, confidence, and component scores when available', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items: [
        ...items,
        {
          id: 'shoes-1',
          imageUrl: 'https://example.com/shoes-1.jpg',
          category: '鞋子',
          subCategory: '乐福鞋',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:06:00Z'
        },
        {
          id: 'bag-1',
          imageUrl: 'https://example.com/bag-1.jpg',
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:07:00Z'
        },
        {
          id: 'accessory-1',
          imageUrl: 'https://example.com/accessory-1.jpg',
          category: '配饰',
          subCategory: '腰带',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:08:00Z'
        }
      ],
      weather: null,
      preferenceState: {
        ...preferenceState,
        profile: {
          ...preferenceState.profile,
          slotPreference: {
            ...preferenceState.profile.slotPreference,
            accessories: true
          }
        }
      }
    })

    const firstRecommendation = recommendations[0]

    expect(firstRecommendation?.shoes?.id).toBe('shoes-1')
    expect(firstRecommendation?.bag?.id).toBe('bag-1')
    expect(firstRecommendation?.accessories?.[0]?.id).toBe('accessory-1')
    expect(firstRecommendation?.missingSlots).toEqual([])
    expect(firstRecommendation?.confidence).toBeGreaterThan(70)
    expect(firstRecommendation?.componentScores?.completeness).toBe(100)
    expect(firstRecommendation?.componentScores?.colorHarmony).toBeGreaterThanOrEqual(0)
    expect(firstRecommendation?.componentScores?.colorHarmony).toBeLessThanOrEqual(100)
    expect(Object.keys(firstRecommendation?.componentScores ?? {}).sort()).toEqual([
      'colorHarmony',
      'completeness',
      'focalPoint',
      'freshness',
      'layering',
      'sceneFit',
      'silhouetteBalance',
      'weatherComfort'
    ])
    expect(Object.keys(firstRecommendation?.scoreBreakdown?.strategyScores ?? {}).sort()).toEqual([...RECOMMENDATION_STRATEGY_KEYS].sort())
    expect(firstRecommendation?.reasonHighlights?.length).toBeGreaterThan(0)
    expect(firstRecommendation?.reasonHighlights?.length).toBeLessThanOrEqual(3)
    expect(firstRecommendation?.mode).toBe('daily')
  })

  it('keeps recommendations when shoes or bag are missing and lowers completeness', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-only-color',
          imageUrl: null,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-only-color',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      weather: null
    })

    expect(recommendations[0]?.top?.id).toBe('top-only-color')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-only-color')
    expect(recommendations[0]?.missingSlots).toEqual(expect.arrayContaining(['shoes', 'bag']))
    expect(recommendations[0]?.componentScores?.completeness).toBeLessThan(100)
    expect(recommendations[0]?.confidence).toBeLessThan(90)
    expect(recommendations[0]?.reason).toContain('未录入鞋履')
    expect(recommendations[0]?.reason).toContain('未录入包袋')
  })

  it('keeps cold-weather recommendations without outerwear and marks the missing outer layer', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-cold',
          imageUrl: null,
          category: '上装',
          subCategory: '针织衫',
          colorCategory: '米色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-cold',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      weather: {
        city: 'Shanghai',
        temperatureC: 6,
        conditionLabel: '阴',
        isWarm: false,
        isCold: true
      }
    })

    expect(recommendations).toHaveLength(3)
    expect(recommendations[0]?.top?.id).toBe('top-cold')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-cold')
    expect(recommendations[0]?.outerLayer).toBeNull()
    expect(recommendations[0]?.missingSlots).toEqual(expect.arrayContaining(['outerLayer']))
    expect(recommendations[0]?.componentScores?.weatherComfort).toBeLessThan(60)
    expect(recommendations[0]?.reason).toContain('当前缺少外层')
  })

  it('uses final weights to change candidate ordering', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-tonal',
          imageUrl: null,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '浅蓝色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-21',
          wearCount: 5,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-tonal',
          imageUrl: null,
          category: '下装',
          subCategory: '西裤',
          colorCategory: '藏蓝色',
          styleTags: ['基础'],
          lastWornDate: '2026-04-21',
          wearCount: 5,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'top-clash',
          imageUrl: null,
          category: '上装',
          subCategory: '针织衫',
          colorCategory: '红色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'bottom-clash',
          imageUrl: null,
          category: '下装',
          subCategory: '长裙',
          colorCategory: '绿色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:03:00Z'
        },
        {
          id: 'shoes-basic',
          imageUrl: null,
          category: '鞋履',
          subCategory: '休闲鞋',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:04:00Z'
        },
        {
          id: 'bag-basic',
          imageUrl: null,
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:05:00Z'
        }
      ],
      weather: null,
      preferenceState: {
        ...preferenceState,
        finalWeights: {
          colorHarmony: 0.86,
          silhouetteBalance: 0.02,
          layering: 0.02,
          focalPoint: 0.02,
          sceneFit: 0.02,
          weatherComfort: 0.02,
          completeness: 0.02,
          freshness: 0.02
        }
      }
    })

    expect(recommendations[0]?.top?.id).toBe('top-tonal')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-tonal')
  })

  it('inserts at most one deterministic inspiration recommendation when exploration is enabled', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items: [
        ...items,
        {
          id: 'shoes-bright',
          imageUrl: null,
          category: '鞋履',
          subCategory: '休闲鞋',
          colorCategory: '红色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:06:00Z'
        },
        {
          id: 'bag-basic',
          imageUrl: null,
          category: '包袋',
          subCategory: '托特包',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:07:00Z'
        }
      ],
      weather: null,
      explorationSeed: 'phase-7-inspiration',
      preferenceState: {
        ...preferenceState,
        profile: {
          ...preferenceState.profile,
          exploration: {
            ...preferenceState.profile.exploration,
            enabled: true,
            rate: 1
          }
        }
      }
    })

    const inspirationRecommendations = recommendations.filter((recommendation) => recommendation.mode === 'inspiration')

    expect(recommendations).toHaveLength(3)
    expect(recommendations[2]?.mode).toBe('inspiration')
    expect(inspirationRecommendations).toHaveLength(1)
    expect(inspirationRecommendations[0]?.id).toMatch(/^inspiration-/u)
    expect(inspirationRecommendations[0]?.inspirationReason).toBe('灵感套装')
    expect(inspirationRecommendations[0]?.dailyDifference).toContain('前两套')
    expect(recommendations.filter((recommendation) => recommendation.mode === 'daily')).toHaveLength(2)
  })

  it('does not insert inspiration recommendations when exploration rate is 0', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items,
      weather: null,
      explorationSeed: 'phase-7-inspiration',
      preferenceState: {
        ...preferenceState,
        profile: {
          ...preferenceState.profile,
          exploration: {
            ...preferenceState.profile.exploration,
            enabled: true,
            rate: 0
          }
        }
      }
    })

    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((recommendation) => recommendation.mode !== 'inspiration')).toBe(true)
  })

  it('does not insert inspiration recommendations that hit hard avoids', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items,
      weather: null,
      explorationSeed: 'phase-7-inspiration',
      preferenceState: {
        ...preferenceState,
        profile: {
          ...preferenceState.profile,
          hardAvoids: ['通勤', '极简'],
          exploration: {
            ...preferenceState.profile.exploration,
            enabled: true,
            rate: 1
          }
        }
      }
    })

    expect(recommendations.every((recommendation) => recommendation.mode !== 'inspiration')).toBe(true)
  })

  it('keeps primary strategies and finisher items varied across a rich Today batch', () => {
    const preferenceState = resetRecommendationPreferences()
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-blue-shirt',
          imageUrl: null,
          category: '上装',
          subCategory: '浅蓝衬衫',
          colorCategory: '浅蓝色',
          styleTags: ['通勤', 'classic'],
          algorithmMeta: { formality: 4, comfortLevel: 3, silhouette: ['短款'] },
          lastWornDate: null,
          wearCount: 3,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'bottom-navy-trouser',
          imageUrl: null,
          category: '下装',
          subCategory: '藏蓝西裤',
          colorCategory: '藏蓝色',
          styleTags: ['通勤', 'classic'],
          algorithmMeta: { formality: 4, comfortLevel: 3, silhouette: ['高腰', '直筒'] },
          lastWornDate: null,
          wearCount: 3,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'top-white-tee',
          imageUrl: null,
          category: '上装',
          subCategory: '白色T恤',
          colorCategory: '白色',
          styleTags: ['基础', '休闲'],
          algorithmMeta: { formality: 2, comfortLevel: 5 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'bottom-jeans',
          imageUrl: null,
          category: '下装',
          subCategory: '牛仔裤',
          colorCategory: '牛仔蓝',
          styleTags: ['休闲', 'denim'],
          algorithmMeta: { formality: 2, comfortLevel: 4, silhouette: ['高腰', '直筒'] },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:03:00Z'
        },
        {
          id: 'top-black-tee',
          imageUrl: null,
          category: '上装',
          subCategory: '黑色T恤',
          colorCategory: '黑色',
          styleTags: ['基础', '运动'],
          algorithmMeta: { formality: 2, comfortLevel: 5 },
          lastWornDate: '2026-04-21',
          wearCount: 2,
          createdAt: '2026-04-19T10:04:00Z'
        },
        {
          id: 'bottom-olive-cargo',
          imageUrl: null,
          category: '下装',
          subCategory: '橄榄绿工装裤',
          colorCategory: '橄榄绿',
          styleTags: ['户外', '运动'],
          algorithmMeta: { formality: 2, comfortLevel: 5, silhouette: ['直筒'] },
          lastWornDate: '2026-04-21',
          wearCount: 2,
          createdAt: '2026-04-19T10:05:00Z'
        },
        {
          id: 'shoes-black-loafer',
          imageUrl: null,
          category: '鞋履',
          subCategory: '黑色乐福鞋',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          algorithmMeta: { formality: 4, comfortLevel: 4 },
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:06:00Z'
        },
        {
          id: 'shoes-white-sneaker',
          imageUrl: null,
          category: '鞋履',
          subCategory: '白色运动鞋',
          colorCategory: '白色',
          styleTags: ['休闲', '舒适'],
          algorithmMeta: { formality: 2, comfortLevel: 5 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:07:00Z'
        },
        {
          id: 'shoes-olive-sneaker',
          imageUrl: null,
          category: '鞋履',
          subCategory: '橄榄绿运动鞋',
          colorCategory: '橄榄绿',
          styleTags: ['户外', '舒适'],
          algorithmMeta: { formality: 2, comfortLevel: 5 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:08:00Z'
        },
        {
          id: 'bag-black-tote',
          imageUrl: null,
          category: '包袋',
          subCategory: '黑色托特包',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          algorithmMeta: { formality: 4 },
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:09:00Z'
        },
        {
          id: 'bag-white-crossbody',
          imageUrl: null,
          category: '包袋',
          subCategory: '白色斜挎包',
          colorCategory: '白色',
          styleTags: ['休闲'],
          algorithmMeta: { formality: 2 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:10:00Z'
        },
        {
          id: 'bag-olive-crossbody',
          imageUrl: null,
          category: '包袋',
          subCategory: '橄榄绿斜挎包',
          colorCategory: '橄榄绿',
          styleTags: ['户外'],
          algorithmMeta: { formality: 2 },
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:11:00Z'
        },
        {
          id: 'cap-navy',
          imageUrl: null,
          category: '配饰',
          subCategory: '藏蓝帽子',
          colorCategory: '藏蓝色',
          styleTags: ['休闲'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:12:00Z'
        }
      ],
      weather: null,
      preferenceState: {
        ...preferenceState,
        profile: {
          ...preferenceState.profile,
          exploration: {
            ...preferenceState.profile.exploration,
            enabled: false,
            rate: 0
          },
          slotPreference: {
            ...preferenceState.profile.slotPreference,
            accessories: true
          }
        }
      }
    })

    const primaryStrategies = recommendations.map((recommendation) => recommendation.scoreBreakdown?.primaryStrategy).filter(Boolean)
    const shoeIds = recommendations.map((recommendation) => recommendation.shoes?.id).filter(Boolean)
    const bagIds = recommendations.map((recommendation) => recommendation.bag?.id).filter(Boolean)

    expect(recommendations).toHaveLength(3)
    expect(new Set(primaryStrategies).size).toBeGreaterThan(1)
    expect(new Set(shoeIds).size).toBeGreaterThan(1)
    expect(new Set(bagIds).size).toBeGreaterThan(1)
  })

  it('adds batch-difference wording when adjacent recommendations could otherwise read alike', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'safe-top-1',
          imageUrl: null,
          category: '上装',
          subCategory: '白色T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'safe-bottom-1',
          imageUrl: null,
          category: '下装',
          subCategory: '黑色西裤',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'safe-top-2',
          imageUrl: null,
          category: '上装',
          subCategory: '灰色T恤',
          colorCategory: '灰色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:02:00Z'
        },
        {
          id: 'safe-bottom-2',
          imageUrl: null,
          category: '下装',
          subCategory: '藏蓝长裤',
          colorCategory: '藏蓝色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:03:00Z'
        },
        {
          id: 'safe-shoes',
          imageUrl: null,
          category: '鞋履',
          subCategory: '黑色乐福鞋',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:04:00Z'
        },
        {
          id: 'safe-bag',
          imageUrl: null,
          category: '包袋',
          subCategory: '黑色托特包',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 2,
          createdAt: '2026-04-19T10:05:00Z'
        }
      ],
      weather: null,
      preferenceState: {
        ...resetRecommendationPreferences(),
        profile: {
          ...resetRecommendationPreferences().profile,
          exploration: {
            ...resetRecommendationPreferences().profile.exploration,
            enabled: false,
            rate: 0
          }
        }
      }
    })

    expect(recommendations[1]?.reasonHighlights?.some((highlight) => highlight.includes('和上一套拉开差异'))).toBe(true)
    expect(recommendations[1]?.reason).toContain('和上一套拉开差异')
  })

  it('falls back to single-item recommendations when the closet lacks full outfits', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-only-1',
          imageUrl: 'https://example.com/top-only-1.jpg',
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'top-only-2',
          imageUrl: 'https://example.com/top-only-2.jpg',
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '蓝色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-21',
          wearCount: 2,
          createdAt: '2026-04-19T10:01:00Z'
        }
      ],
      weather: null
    })

    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((recommendation) => recommendation.top && !recommendation.bottom && !recommendation.dress)).toBe(
      true
    )
    expect(recommendations.some((recommendation) => recommendation.reason.includes('先用已有单品起一套思路'))).toBe(true)
    expect(recommendations.some((recommendation) => recommendation.reason.includes('适合换一套思路'))).toBe(true)
  })

  it('prioritizes items that have not been worn recently', () => {
    const recommendations = generateTodayRecommendations({
      items: [
        {
          id: 'top-fresh',
          imageUrl: 'https://example.com/top-fresh.jpg',
          category: '上衣',
          subCategory: '白T恤',
          colorCategory: '白色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T10:00:00Z'
        },
        {
          id: 'top-recent',
          imageUrl: 'https://example.com/top-recent.jpg',
          category: '上衣',
          subCategory: '针织衫',
          colorCategory: '灰色',
          styleTags: ['通勤'],
          lastWornDate: '2026-04-21',
          wearCount: 5,
          createdAt: '2026-04-19T10:01:00Z'
        },
        {
          id: 'bottom-fresh',
          imageUrl: 'https://example.com/bottom-fresh.jpg',
          category: '裤装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-04-19T10:02:00Z'
        }
      ],
      weather: null
    })

    expect(recommendations[0]?.top?.id).toBe('top-fresh')
    expect(recommendations[0]?.bottom?.id).toBe('bottom-fresh')
  })

  it('returns a visibly different batch when offset increases', () => {
    const firstBatch = generateTodayRecommendations({ items, weather: null, offset: 0 })
    const secondBatch = generateTodayRecommendations({ items, weather: null, offset: 1 })

    expect(firstBatch).toHaveLength(3)
    expect(secondBatch).toHaveLength(3)
    expect(secondBatch.map((item) => item.id)).not.toEqual(firstBatch.map((item) => item.id))
  })
})
