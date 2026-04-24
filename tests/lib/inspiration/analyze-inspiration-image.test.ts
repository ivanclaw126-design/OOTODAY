import { afterEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllEnvs()
})

describe('analyzeInspirationImage', () => {
  it('parses a structured inspiration breakdown from the AI response', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('OPENAI_BASE_URL', 'https://api.example.com/v1')
    vi.stubEnv('OPENAI_MODEL', 'test-model')

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: '极简通勤感很强的一套黑白配色',
                scene: '适合工作日通勤',
                vibe: '克制、利落、带一点知识分子感',
                color_formula: '黑白基础色 + 低饱和灰色过渡',
                silhouette_formula: '短外套 + 直筒下装',
                layering_formula: '外短内长，轻外层压住通勤感',
                focal_point: '短西装外套的利落肩线',
                key_items: [
                  {
                    label: '短西装外套',
                    category: '外套',
                    slot: 'outerLayer',
                    color_hint: '黑色',
                    silhouette: ['短款', '硬挺'],
                    layer_role: 'outer',
                    importance: 5,
                    style_tags: ['通勤', '极简'],
                    alternatives: ['短夹克', '黑色开衫']
                  },
                  {
                    label: '直筒西裤',
                    category: '裤装',
                    slot: 'bottom',
                    color_hint: '炭灰',
                    silhouette: ['直筒'],
                    layer_role: 'base',
                    importance: 5,
                    style_tags: ['通勤'],
                    alternatives: ['深色直筒牛仔裤']
                  }
                ],
                styling_tips: ['保持上短下长比例', '配色尽量控制在 2-3 个颜色内'],
                color_strategy_notes: ['保住黑白基础色，灰色只做过渡。']
              })
            }
          }
        ]
      })
    })

    const { analyzeInspirationImage } = await import('@/lib/inspiration/analyze-inspiration-image')
    const result = await analyzeInspirationImage('https://example.com/inspiration.jpg')

    expect(result.summary).toBe('极简通勤感很强的一套黑白配色')
    expect(result.colorFormula).toBe('黑白基础色 + 低饱和灰色过渡')
    expect(result.silhouetteFormula).toBe('短外套 + 直筒下装')
    expect(result.layeringFormula).toBe('外短内长，轻外层压住通勤感')
    expect(result.focalPoint).toBe('短西装外套的利落肩线')
    expect(result.keyItems).toHaveLength(2)
    expect(result.keyItems[0]).toMatchObject({
      label: '短西装外套',
      category: '外套',
      slot: 'outerLayer',
      colorHint: '黑色',
      silhouette: ['短款', '硬挺'],
      layerRole: 'outer',
      importance: 5,
      styleTags: ['通勤', '极简'],
      alternatives: ['短夹克', '黑色开衫']
    })
    expect(result.stylingTips).toEqual(['保持上短下长比例', '配色尽量控制在 2-3 个颜色内'])
    expect(result.colorStrategyNotes).toEqual(['保住黑白基础色，灰色只做过渡。'])
  })

  it('falls back when formula and key-item metadata are missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('OPENAI_BASE_URL', 'https://api.example.com/v1')
    vi.stubEnv('OPENAI_MODEL', 'test-model')

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: '红色针织衫搭黑色下装',
                scene: '周末咖啡',
                vibe: '松弛',
                key_items: [
                  {
                    label: '红色针织衫',
                    category: '上衣',
                    color_hint: '红色'
                  }
                ]
              })
            }
          }
        ]
      })
    })

    const { analyzeInspirationImage } = await import('@/lib/inspiration/analyze-inspiration-image')
    const result = await analyzeInspirationImage('https://example.com/fallback.jpg')

    expect(result.colorFormula).toContain('红色')
    expect(result.silhouetteFormula).toContain('松弛')
    expect(result.layeringFormula).toContain('叠穿公式暂未识别清楚')
    expect(result.focalPoint).toContain('红色针织衫')
    expect(result.keyItems[0]).toMatchObject({
      label: '红色针织衫',
      slot: 'top',
      silhouette: [],
      layerRole: null,
      importance: null,
      styleTags: []
    })
    expect(result.stylingTips).toEqual([])
  })
})
