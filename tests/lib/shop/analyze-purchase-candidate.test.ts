import { describe, expect, it } from 'vitest'
import { analyzePurchaseCandidate, getUnsupportedShopCategoryMessage, supportedFashionCategories } from '@/lib/shop/analyze-purchase-candidate'

const closetItems = [
  {
    id: 'top-1',
    imageUrl: null,
    category: '上衣',
    subCategory: '白T恤',
    colorCategory: '白色',
    styleTags: ['基础'],
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-20T10:00:00Z'
  },
  {
    id: 'bottom-1',
    imageUrl: null,
    category: '裤装',
    subCategory: '西裤',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    lastWornDate: null,
    wearCount: 1,
    createdAt: '2026-04-20T10:01:00Z'
  },
  {
    id: 'bottom-2',
    imageUrl: null,
    category: '裙装',
    subCategory: '半裙',
    colorCategory: '灰色',
    styleTags: ['极简'],
    lastWornDate: null,
    wearCount: 2,
    createdAt: '2026-04-20T10:02:00Z'
  }
]

describe('analyzePurchaseCandidate', () => {
  it('flags unsupported non-fashion categories before analysis', () => {
    expect(getUnsupportedShopCategoryMessage('电器配件')).toContain('当前支持')
    expect(getUnsupportedShopCategoryMessage('上衣')).toBeNull()
    expect(getUnsupportedShopCategoryMessage('乐福鞋')).toBeNull()
    expect(getUnsupportedShopCategoryMessage('包袋')).toBeNull()
    expect(getUnsupportedShopCategoryMessage('配饰')).toBeNull()
    expect(supportedFashionCategories).toEqual(['上装', '下装', '连体/全身装', '外层', '鞋履', '包袋', '配饰'])
  })

  it('recommends buying low-duplicate items that unlock multiple outfits', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/candidate.jpg',
        imageCandidates: ['https://example.com/candidate.jpg'],
        sourceUrl: 'https://example.com/candidate.jpg',
        sourceTitle: null,
        category: '上衣',
        subCategory: '针织衫',
        colorCategory: '藏蓝',
        styleTags: ['通勤']
      },
      closetItems
    )

    expect(analysis.recommendation).toBe('consider')
    expect(analysis.estimatedOutfitCount).toBe(2)
    expect(analysis.duplicateRisk).toBe('low')
    expect(analysis.colorStrategyHints[0]).toContain('过渡层')
  })

  it('marks clearly overlapping items as skip', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/candidate.jpg',
        imageCandidates: ['https://example.com/candidate.jpg'],
        sourceUrl: 'https://example.com/candidate.jpg',
        sourceTitle: null,
        category: '上衣',
        subCategory: '白T恤',
        colorCategory: '白色',
        styleTags: ['基础']
      },
      closetItems
    )

    expect(analysis.duplicateRisk).toBe('medium')
    expect(analysis.duplicateItems).toHaveLength(1)
    expect(analysis.recommendation).toBe('consider')
  })

  it('advises skipping when the closet cannot support the item', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/candidate.jpg',
        imageCandidates: ['https://example.com/candidate.jpg'],
        sourceUrl: 'https://example.com/candidate.jpg',
        sourceTitle: null,
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      },
      []
    )

    expect(analysis.estimatedOutfitCount).toBe(0)
    expect(analysis.recommendation).toBe('skip')
    expect(analysis.missingCategoryHints[0]).toContain('下装')
  })

  it('uses shared color-role language when the closet can anchor a vivid item', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/candidate.jpg',
        imageCandidates: ['https://example.com/candidate.jpg'],
        sourceUrl: 'https://example.com/item',
        sourceTitle: '红色针织衫',
        category: '上衣',
        subCategory: '针织衫',
        colorCategory: '红色',
        styleTags: ['通勤']
      },
      closetItems
    )

    expect(analysis.colorStrategyHints.some((hint) => hint.includes('颜色存在感更强'))).toBe(true)
    expect(analysis.colorStrategyHints.some((hint) => hint.includes('基础色够用'))).toBe(true)
    expect(analysis.recommendationReason).toContain('颜色存在感更强')
  })

  it('analyzes shoes by counting how many core outfits they can finish', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/shoes.jpg',
        imageCandidates: ['https://example.com/shoes.jpg'],
        sourceUrl: 'https://example.com/shoes',
        sourceTitle: '黑色乐福鞋',
        category: '鞋履',
        subCategory: '乐福鞋',
        colorCategory: '黑色',
        styleTags: ['通勤']
      },
      closetItems
    )

    expect(analysis.estimatedOutfitCount).toBe(2)
    expect(analysis.unlocksOutfitCount).toBe(2)
    expect(analysis.completesIncompleteOutfitCount).toBe(2)
    expect(analysis.fillsWardrobeGap).toBe(true)
    expect(analysis.gapType).toBe('shoeFinisher')
    expect(analysis.missingCategoryHints[0]).toContain('鞋履')
    expect(analysis.recommendationReason).toContain('收尾')
  })

  it('analyzes bags through scene completeness and color echo', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/bag.jpg',
        imageCandidates: ['https://example.com/bag.jpg'],
        sourceUrl: 'https://example.com/bag',
        sourceTitle: '黑色托特包',
        category: '包袋',
        subCategory: '托特包',
        colorCategory: '黑色',
        styleTags: ['通勤']
      },
      closetItems
    )

    expect(analysis.estimatedOutfitCount).toBe(1)
    expect(analysis.completesIncompleteOutfitCount).toBe(2)
    expect(analysis.fillsWardrobeGap).toBe(true)
    expect(analysis.gapType).toBe('sceneBag')
    expect(analysis.missingCategoryHints[0]).toContain('包袋')
  })

  it('analyzes accessories as visual focus or style reinforcement instead of simple outfit count', () => {
    const analysis = analyzePurchaseCandidate(
      {
        imageUrl: 'https://example.com/belt.jpg',
        imageCandidates: ['https://example.com/belt.jpg'],
        sourceUrl: 'https://example.com/belt',
        sourceTitle: '黑色腰带',
        category: '配饰',
        subCategory: '腰带',
        colorCategory: '黑色',
        styleTags: ['通勤']
      },
      closetItems
    )

    expect(analysis.estimatedOutfitCount).toBe(1)
    expect(analysis.unlocksOutfitCount).toBe(1)
    expect(analysis.completesIncompleteOutfitCount).toBe(0)
    expect(analysis.fillsWardrobeGap).toBe(true)
    expect(analysis.gapType).toBe('visualFocus')
    expect(analysis.recommendationReason).toContain('视觉中心')
    expect(analysis.recommendationReason).toContain('不是简单增加可搭套数')
  })
})
