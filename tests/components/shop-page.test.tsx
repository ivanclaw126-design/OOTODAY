import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ShopPage } from '@/components/shop/shop-page'

const upload = vi.fn()
const getPublicUrl = vi.fn()
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload,
        getPublicUrl
      })
    }
  })
}))

describe('ShopPage', () => {
  beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:preview-image')
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn()
    })
  })

  afterAll(() => {
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreateObjectURL
      })
    } else {
      delete (URL as typeof URL & { createObjectURL?: (url: string) => string }).createObjectURL
    }

    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevokeObjectURL
      })
    } else {
      delete (URL as typeof URL & { revokeObjectURL?: (url: string) => void }).revokeObjectURL
    }
  })

  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    upload.mockReset()
    getPublicUrl.mockReset()
    ;(URL.createObjectURL as ReturnType<typeof vi.fn>).mockClear()
    ;(URL.revokeObjectURL as ReturnType<typeof vi.fn>).mockClear()
  })

  it('submits an image url and renders the analysis result', async () => {
    const analyzeCandidate = vi.fn().mockResolvedValue({
      error: null,
      analysis: {
        candidate: {
          imageUrl: 'https://example.com/item.jpg',
          imageCandidates: ['https://example.com/item.jpg'],
          sourceUrl: 'https://shop.example.com/item',
          sourceTitle: 'Soft Knit Cardigan',
          category: '上衣',
          subCategory: '针织衫',
          colorCategory: '藏蓝',
          styleTags: ['通勤']
        },
        duplicateItems: [],
        duplicateRisk: 'low',
        estimatedOutfitCount: 3,
        missingCategoryHints: [],
        colorStrategyHints: [],
        recommendation: 'buy',
        recommendationReason: '它和现有衣橱能快速接上，新增后大概率能立刻穿起来。'
      }
    })

    render(<ShopPage itemCount={3} userId="user-1" storageBucket="ootd-images" analyzeCandidate={analyzeCandidate} />)

    fireEvent.change(screen.getByRole('textbox', { name: '商品链接或图片链接' }), {
      target: { value: 'https://shop.example.com/item' }
    })
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }))

    await waitFor(() => {
      expect(analyzeCandidate).toHaveBeenCalledWith({
        sourceUrl: 'https://shop.example.com/item',
        preferredImageUrl: undefined
      })
    })

    expect(screen.getByText('建议买')).toBeInTheDocument()
    expect(screen.getByText('Soft Knit Cardigan')).toBeInTheDocument()
    expect(screen.getByText('Outfit Yield')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByAltText('Soft Knit Cardigan 商品图')).toBeInTheDocument()
  })

  it('uploads a local image and analyzes the uploaded public url', async () => {
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/uploads/local-item.jpg' }
    })

    const analyzeCandidate = vi.fn().mockResolvedValue({
      error: null,
      analysis: {
        candidate: {
          imageUrl: 'https://example.com/uploads/local-item.jpg',
          imageCandidates: ['https://example.com/uploads/local-item.jpg'],
          sourceUrl: 'https://example.com/uploads/local-item.jpg',
          sourceTitle: null,
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['极简']
        },
        duplicateItems: [],
        duplicateRisk: 'low',
        estimatedOutfitCount: 2,
        missingCategoryHints: [],
        colorStrategyHints: [],
        recommendation: 'consider',
        recommendationReason: '它可以补充现有衣橱，但收益还没有高到闭眼入。'
      }
    })

    render(<ShopPage itemCount={3} userId="user-1" storageBucket="ootd-images" analyzeCandidate={analyzeCandidate} />)

    const file = new File(['image'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('上传商品图片'), {
      target: { files: [file] }
    })

    await waitFor(() => {
      expect(upload).toHaveBeenCalled()
      expect(analyzeCandidate).toHaveBeenCalledWith({
        sourceUrl: 'https://example.com/uploads/local-item.jpg',
        preferredImageUrl: undefined
      })
    })

    expect(screen.getByText('衬衫 · 白色')).toBeInTheDocument()
  })

  it('supports drag and drop uploads on desktop', async () => {
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/uploads/dropped-item.jpg' }
    })

    const analyzeCandidate = vi.fn().mockResolvedValue({
      error: null,
      analysis: {
        candidate: {
          imageUrl: 'https://example.com/uploads/dropped-item.jpg',
          imageCandidates: ['https://example.com/uploads/dropped-item.jpg'],
          sourceUrl: 'https://example.com/uploads/dropped-item.jpg',
          sourceTitle: null,
          category: '外套',
          subCategory: '夹克',
          colorCategory: '黑色',
          styleTags: ['通勤']
        },
        duplicateItems: [],
        duplicateRisk: 'low',
        estimatedOutfitCount: 1,
        missingCategoryHints: [],
        colorStrategyHints: [],
        recommendation: 'consider',
        recommendationReason: '它可以补充现有衣橱，但收益还没有高到闭眼入。'
      }
    })

    render(<ShopPage itemCount={3} userId="user-1" storageBucket="ootd-images" analyzeCandidate={analyzeCandidate} />)

    const file = new File(['image'], 'jacket.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByText('拖拽图片到这里').closest('label')!, {
      dataTransfer: {
        files: [file]
      }
    })

    await waitFor(() => {
      expect(upload).toHaveBeenCalled()
      expect(analyzeCandidate).toHaveBeenCalledWith({
        sourceUrl: 'https://example.com/uploads/dropped-item.jpg',
        preferredImageUrl: undefined
      })
    })

    expect(screen.getByText('夹克 · 黑色')).toBeInTheDocument()
  })

  it('clears the uploaded image state so users can reselect another file', async () => {
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/uploads/local-item.jpg' }
    })

    const analyzeCandidate = vi.fn().mockResolvedValue({
      error: null,
      analysis: {
        candidate: {
          imageUrl: 'https://example.com/uploads/local-item.jpg',
          imageCandidates: ['https://example.com/uploads/local-item.jpg'],
          sourceUrl: 'https://example.com/uploads/local-item.jpg',
          sourceTitle: null,
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '白色',
          styleTags: ['极简']
        },
        duplicateItems: [],
        duplicateRisk: 'low',
        estimatedOutfitCount: 2,
        missingCategoryHints: [],
        colorStrategyHints: [],
        recommendation: 'consider',
        recommendationReason: '它可以补充现有衣橱，但收益还没有高到闭眼入。'
      }
    })

    render(<ShopPage itemCount={3} userId="user-1" storageBucket="ootd-images" analyzeCandidate={analyzeCandidate} />)

    const file = new File(['image'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('上传商品图片'), {
      target: { files: [file] }
    })

    await waitFor(() => {
      expect(analyzeCandidate).toHaveBeenCalledWith({
        sourceUrl: 'https://example.com/uploads/local-item.jpg',
        preferredImageUrl: undefined
      })
    })

    fireEvent.click(screen.getByRole('button', { name: '删除当前图片' }))

    expect(screen.queryByText('已选择：shirt.png')).not.toBeInTheDocument()
    expect(screen.queryByAltText('待分析商品预览')).not.toBeInTheDocument()
    expect(screen.queryByText('衬衫 · 白色')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '商品链接或图片链接' })).toHaveValue('')
    expect(screen.queryByRole('button', { name: '删除当前图片' })).not.toBeInTheDocument()
  })

  it('lets users switch to another candidate image and rerun analysis', async () => {
    const analyzeCandidate = vi
      .fn()
      .mockResolvedValueOnce({
        error: null,
        analysis: {
          candidate: {
            imageUrl: 'https://example.com/model-look.jpg',
            imageCandidates: ['https://example.com/model-look.jpg', 'https://example.com/clean-product.jpg'],
            sourceUrl: 'https://shop.example.com/item',
            sourceTitle: 'Soft Knit Cardigan',
            category: '上衣',
            subCategory: '针织衫',
            colorCategory: '藏蓝',
            styleTags: ['通勤']
          },
          duplicateItems: [],
          duplicateRisk: 'low',
          estimatedOutfitCount: 3,
          missingCategoryHints: [],
          colorStrategyHints: [],
          recommendation: 'buy',
          recommendationReason: '它和现有衣橱能快速接上，新增后大概率能立刻穿起来。'
        }
      })
      .mockResolvedValueOnce({
        error: null,
        analysis: {
          candidate: {
            imageUrl: 'https://example.com/clean-product.jpg',
            imageCandidates: ['https://example.com/clean-product.jpg', 'https://example.com/model-look.jpg'],
            sourceUrl: 'https://shop.example.com/item',
            sourceTitle: 'Soft Knit Cardigan',
            category: '上衣',
            subCategory: '针织衫',
            colorCategory: '藏蓝',
            styleTags: ['通勤']
          },
          duplicateItems: [],
          duplicateRisk: 'low',
          estimatedOutfitCount: 3,
          missingCategoryHints: [],
          colorStrategyHints: [],
          recommendation: 'buy',
          recommendationReason: '它和现有衣橱能快速接上，新增后大概率能立刻穿起来。'
        }
      })

    render(<ShopPage itemCount={3} userId="user-1" storageBucket="ootd-images" analyzeCandidate={analyzeCandidate} />)

    fireEvent.change(screen.getByRole('textbox', { name: '商品链接或图片链接' }), {
      target: { value: 'https://shop.example.com/item' }
    })
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }))

    await waitFor(() => {
      expect(screen.getByAltText('Soft Knit Cardigan 商品图')).toHaveAttribute('src', 'https://example.com/model-look.jpg')
    })

    fireEvent.click(screen.getByRole('button', { name: '切换候选图 2' }))

    await waitFor(() => {
      expect(analyzeCandidate).toHaveBeenLastCalledWith({
        sourceUrl: 'https://shop.example.com/item',
        preferredImageUrl: 'https://example.com/clean-product.jpg'
      })
    })

    expect(screen.getByAltText('Soft Knit Cardigan 商品图')).toHaveAttribute('src', 'https://example.com/clean-product.jpg')
  })
})
