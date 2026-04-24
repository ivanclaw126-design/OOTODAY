import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { InspirationPage } from '@/components/inspiration/inspiration-page'

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

describe('InspirationPage', () => {
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

  it('renders breakdown and closet matches from a pasted image url', async () => {
    const analyzeInspiration = vi.fn().mockResolvedValue({
      error: null,
      analysis: {
        sourceUrl: 'https://example.com/look.jpg',
        sourceTitle: 'Paris Street Look',
        imageUrl: 'https://example.com/look.jpg',
        breakdown: {
          summary: '极简通勤感很强的一套黑白配色',
          scene: '工作日通勤',
          vibe: '克制、利落',
          colorFormula: '黑白基础色 + 灰色过渡',
          silhouetteFormula: '短外套 + 直筒下装',
          layeringFormula: '外短内长',
          focalPoint: '黑色西装外套',
          keyItems: [
            {
              id: 'item-1',
              label: '西装外套',
              category: '外套',
              slot: 'outerLayer',
              colorHint: '黑色',
              silhouette: ['短款', '硬挺'],
              layerRole: 'outer',
              importance: 5,
              styleTags: ['通勤'],
              alternatives: ['短夹克']
            }
          ],
          stylingTips: ['保持线条干净'],
          colorStrategyNotes: ['这套灵感有基础色托底，所以整体看起来更稳。']
        },
        closetMatches: [
          {
            inspirationItem: {
              id: 'item-1',
              label: '西装外套',
              category: '外套',
              slot: 'outerLayer',
              colorHint: '黑色',
              silhouette: ['短款', '硬挺'],
              layerRole: 'outer',
              importance: 5,
              styleTags: ['通勤'],
              alternatives: ['短夹克']
            },
            matchedItems: [
              {
                id: 'coat-1',
                imageUrl: null,
                category: '外套',
                subCategory: '西装外套',
                colorCategory: '黑色',
                styleTags: ['通勤'],
                lastWornDate: null,
                wearCount: 0,
                createdAt: '2026-04-22T00:00:00Z'
              }
            ],
            matchReason: '同类替代：按类别 35%、slot 15%、颜色 20%、轮廓 15%、风格 10%、层次 5% 加权排序。',
            substituteSuggestion: null,
            scoreBreakdown: {
              total: 0.9,
              categoryScore: 0.35,
              slotScore: 0.15,
              colorScore: 0.2,
              silhouetteScore: 0.15,
              styleScore: 0.0,
              layerRoleScore: 0.05,
              matchType: 'sameCategory'
            }
          }
        ],
        remixPlan: {
          title: '我的版本怎么穿',
          summary: '你衣橱里的核心单品已经够用，可以先按这个顺序直接复刻。',
          matchedCount: 1,
          totalCount: 1,
          coverageLabel: '复刻完成度高',
          steps: [
            {
              inspirationItem: {
                id: 'item-1',
                label: '西装外套',
                category: '外套',
                slot: 'outerLayer',
                colorHint: '黑色',
                silhouette: ['短款', '硬挺'],
                layerRole: 'outer',
                importance: 5,
                styleTags: ['通勤'],
                alternatives: ['短夹克']
              },
              matchedItem: {
                id: 'coat-1',
                imageUrl: null,
                category: '外套',
                subCategory: '西装外套',
                colorCategory: '黑色',
                styleTags: ['通勤'],
                lastWornDate: null,
                wearCount: 0,
                createdAt: '2026-04-22T00:00:00Z'
              },
              note: '先用你的黑色 西装外套来代替这件西装外套。'
            }
          ],
          missingItems: []
        }
      }
    })

    render(
      <InspirationPage
        itemCount={3}
        userId="user-1"
        storageBucket="ootd-images"
        analyzeInspiration={analyzeInspiration}
      />
    )

    expect(screen.getByRole('heading', { name: 'Looks' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: '灵感图片链接' }), {
      target: { value: 'https://example.com/look.jpg' }
    })
    fireEvent.click(screen.getByRole('button', { name: '开始拆解' }))

    await waitFor(() => {
      expect(analyzeInspiration).toHaveBeenCalledWith({ sourceUrl: 'https://example.com/look.jpg' })
    })

    expect(screen.getByText('极简通勤感很强的一套黑白配色')).toBeInTheDocument()
    expect(screen.getByText('色彩公式 · 黑白基础色 + 灰色过渡')).toBeInTheDocument()
    expect(screen.getByText('轮廓公式 · 短外套 + 直筒下装')).toBeInTheDocument()
    expect(screen.getByText('西装外套 · 外套')).toBeInTheDocument()
    expect(screen.getByText(/外套 · outerLayer · 黑色 · 短款 \/ 硬挺/)).toBeInTheDocument()
    expect(screen.getByText('可替代：短夹克')).toBeInTheDocument()
    expect(screen.getByText('同类替代：按类别 35%、slot 15%、颜色 20%、轮廓 15%、风格 10%、层次 5% 加权排序。')).toBeInTheDocument()
    expect(screen.getByText(/匹配分 90/)).toBeInTheDocument()
    expect(screen.getByText('保持线条干净')).toBeInTheDocument()
    expect(screen.getByText('我的版本怎么穿')).toBeInTheDocument()
    expect(screen.getByText('完成度：1/1')).toBeInTheDocument()
  })

  it('uploads a local inspiration image and runs the same analysis flow', async () => {
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/uploads/look.jpg' }
    })

    const analyzeInspiration = vi.fn().mockResolvedValue({
      error: null,
      analysis: {
        sourceUrl: 'https://example.com/uploads/look.jpg',
        sourceTitle: null,
        imageUrl: 'https://example.com/uploads/look.jpg',
        breakdown: {
          summary: '干净利落的通勤 look',
          scene: '通勤',
          vibe: '利落',
          colorFormula: '黑白基础色',
          silhouetteFormula: '利落直线',
          layeringFormula: '轻外层',
          focalPoint: '肩线',
          keyItems: [],
          stylingTips: [],
          colorStrategyNotes: []
        },
        closetMatches: [],
        remixPlan: {
          title: '我的版本怎么穿',
          summary: '这张灵感图还没拆出足够明确的单品，暂时没法拼出稳定复刻方案。',
          matchedCount: 0,
          totalCount: 0,
          coverageLabel: '先补一张有明确穿搭单品的灵感图',
          steps: [],
          missingItems: []
        }
      }
    })

    render(
      <InspirationPage
        itemCount={3}
        userId="user-1"
        storageBucket="ootd-images"
        analyzeInspiration={analyzeInspiration}
      />
    )

    const file = new File(['image'], 'look.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('上传灵感图片'), {
      target: { files: [file] }
    })

    await waitFor(() => {
      expect(upload).toHaveBeenCalled()
      expect(analyzeInspiration).toHaveBeenCalledWith({ sourceUrl: 'https://example.com/uploads/look.jpg' })
    })

    expect(screen.getByText('干净利落的通勤 look')).toBeInTheDocument()
  })
})
