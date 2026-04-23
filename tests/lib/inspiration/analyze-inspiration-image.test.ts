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
                key_items: [
                  {
                    label: '短西装外套',
                    category: '外套',
                    color_hint: '黑色',
                    style_tags: ['通勤', '极简']
                  },
                  {
                    label: '直筒西裤',
                    category: '裤装',
                    color_hint: '炭灰',
                    style_tags: ['通勤']
                  }
                ],
                styling_tips: ['保持上短下长比例', '配色尽量控制在 2-3 个颜色内']
              })
            }
          }
        ]
      })
    })

    const { analyzeInspirationImage } = await import('@/lib/inspiration/analyze-inspiration-image')
    const result = await analyzeInspirationImage('https://example.com/inspiration.jpg')

    expect(result.summary).toBe('极简通勤感很强的一套黑白配色')
    expect(result.keyItems).toHaveLength(2)
    expect(result.keyItems[0]).toMatchObject({
      label: '短西装外套',
      category: '外套',
      colorHint: '黑色',
      styleTags: ['通勤', '极简']
    })
    expect(result.stylingTips).toEqual(['保持上短下长比例', '配色尽量控制在 2-3 个颜色内'])
    expect(result.colorStrategyNotes.length).toBeGreaterThan(0)
  })
})
