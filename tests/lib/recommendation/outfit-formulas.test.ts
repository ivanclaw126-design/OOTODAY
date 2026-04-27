import { describe, expect, it } from 'vitest'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { itemMatchesFormulaSlot, rankOutfitFormulas } from '@/lib/recommendation/outfit-formulas'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'

function item(overrides: Partial<ClosetItemCardData>): ClosetItemCardData {
  return {
    id: overrides.id ?? 'item',
    imageUrl: null,
    category: overrides.category ?? '上装',
    subCategory: overrides.subCategory ?? '针织衫',
    colorCategory: overrides.colorCategory ?? '米色',
    styleTags: overrides.styleTags ?? ['通勤'],
    seasonTags: overrides.seasonTags,
    algorithmMeta: overrides.algorithmMeta,
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-27T00:00:00Z'
  }
}

describe('outfit formula registry', () => {
  it('matches slot constraints as first-class candidate generation rules', () => {
    const formula = rankOutfitFormulas({
      profile: {
        ...DEFAULT_PREFERENCE_PROFILE,
        preferredScenes: ['work']
      },
      weather: null
    }).find((candidate) => candidate.id === 'work-knit-trouser-loafer')

    expect(formula).toBeTruthy()
    expect(itemMatchesFormulaSlot(item({ subCategory: '针织衫' }), formula!, 'top')).toBe(true)
    expect(itemMatchesFormulaSlot(item({ category: '下装', subCategory: '西裤' }), formula!, 'bottom')).toBe(true)
    expect(itemMatchesFormulaSlot(item({ category: '下装', subCategory: '牛仔短裤', styleTags: ['休闲'] }), formula!, 'bottom')).toBe(false)
  })

  it('ranks formulas by user scene and weather instead of static order only', () => {
    const ranked = rankOutfitFormulas({
      profile: {
        ...DEFAULT_PREFERENCE_PROFILE,
        preferredScenes: ['travel']
      },
      weather: {
        city: 'Shanghai',
        temperatureC: 28,
        conditionLabel: '晴',
        isWarm: true,
        isCold: false
      }
    })

    expect(ranked[0]?.id).toBe('tee-wide-pants-sneaker')
  })
})
