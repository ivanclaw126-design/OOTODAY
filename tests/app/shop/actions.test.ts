import { afterEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const analyzeItemImage = vi.fn()
const getClosetView = vi.fn()
const resolveShopInput = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/closet/analyze-item-image', () => ({
  analyzeItemImage
}))

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/shop/resolve-shop-input', () => ({
  resolveShopInput
}))

afterEach(() => {
  getSession.mockReset()
  analyzeItemImage.mockReset()
  getClosetView.mockReset()
  resolveShopInput.mockReset()
  vi.resetModules()
})

describe('analyzeShopCandidateAction', () => {
  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null)

    const { analyzeShopCandidateAction } = await import('@/app/shop/actions')

    await expect(analyzeShopCandidateAction({ sourceUrl: 'https://example.com/item.jpg' })).rejects.toThrow(
      'Unauthorized'
    )
  })

  it('returns validation error for invalid urls', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: '请输入可访问的商品链接或图片链接',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    })

    const { analyzeShopCandidateAction } = await import('@/app/shop/actions')

    await expect(analyzeShopCandidateAction({ sourceUrl: 'not-a-url' })).resolves.toEqual({
      error: '请输入可访问的商品链接或图片链接',
      analysis: null
    })
  })

  it('analyzes the candidate against the closet', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://example.com/item.jpg',
      imageCandidates: ['https://example.com/item.jpg'],
      sourceTitle: 'Soft Knit Cardigan',
      sourceUrl: 'https://shop.example.com/item'
    })
    analyzeItemImage.mockResolvedValue({
      category: '上衣',
      subCategory: '针织衫',
      colorCategory: '藏蓝',
      styleTags: ['通勤']
    })
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: [
        {
          id: 'bottom-1',
          imageUrl: null,
          category: '裤装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-20T10:00:00Z'
        }
      ]
    })

    const { analyzeShopCandidateAction } = await import('@/app/shop/actions')

    const result = await analyzeShopCandidateAction({ sourceUrl: 'https://shop.example.com/item' })

    expect(result.error).toBeNull()
    expect(result.analysis?.candidate.subCategory).toBe('针织衫')
    expect(result.analysis?.candidate.sourceTitle).toBe('Soft Knit Cardigan')
    expect(result.analysis?.candidate.imageCandidates).toEqual(['https://example.com/item.jpg'])
    expect(result.analysis?.estimatedOutfitCount).toBe(1)
    expect(result.analysis?.recommendation).toBe('consider')
  })

  it('returns a category-fit error for non-fashion items', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://example.com/item.jpg',
      imageCandidates: ['https://example.com/item.jpg'],
      sourceTitle: 'Industrial Socket',
      sourceUrl: 'https://shop.example.com/item'
    })
    analyzeItemImage.mockResolvedValue({
      category: '电器配件',
      subCategory: '工业插座',
      colorCategory: '金属色',
      styleTags: ['工业风']
    })
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: []
    })

    const { analyzeShopCandidateAction } = await import('@/app/shop/actions')

    await expect(analyzeShopCandidateAction({ sourceUrl: 'https://shop.example.com/item' })).resolves.toEqual({
      error: '当前支持上装、下装、连体/全身装、外层、鞋履、包袋、配饰这类时尚单品分析，请换一个商品链接或图片试试',
      analysis: null
    })
  })

  it('passes the preferred candidate image when users switch product images', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://example.com/clean-product.jpg',
      imageCandidates: ['https://example.com/clean-product.jpg', 'https://example.com/model-look.jpg'],
      sourceTitle: 'Soft Knit Cardigan',
      sourceUrl: 'https://shop.example.com/item'
    })
    analyzeItemImage.mockResolvedValue({
      category: '上装',
      subCategory: '针织衫',
      colorCategory: '藏蓝',
      styleTags: ['通勤']
    })
    getClosetView.mockResolvedValue({
      itemCount: 1,
      items: []
    })

    const { analyzeShopCandidateAction } = await import('@/app/shop/actions')

    await analyzeShopCandidateAction({
      sourceUrl: 'https://shop.example.com/item',
      preferredImageUrl: 'https://example.com/clean-product.jpg'
    })

    expect(resolveShopInput).toHaveBeenCalledWith('https://shop.example.com/item', {
      preferredImageUrl: 'https://example.com/clean-product.jpg'
    })
  })
})
