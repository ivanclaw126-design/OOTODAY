import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('analyzeItemImage', () => {
  it('maps the model JSON into the closet analysis shape', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: '上衣',
                sub_category: '衬衫',
                color_category: '蓝色',
                style_tags: ['通勤', '简约']
              })
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).resolves.toEqual({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤', '简约']
    })
  })

  it('throws when the API key is missing', async () => {
    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).rejects.toThrow('Missing OPENAI_API_KEY')
  })

  it('throws when the OpenAI request fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({})
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).rejects.toThrow('OpenAI request failed')
  })

  it('throws when OpenAI returns empty content', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: ''
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).rejects.toThrow('OpenAI returned empty content')
  })

  it('throws when OpenAI returns invalid JSON', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{bad json'
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).rejects.toThrow('OpenAI returned invalid JSON')
  })

  it('throws when style_tags is not an array', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: '上衣',
                sub_category: '衬衫',
                color_category: '蓝色',
                style_tags: '通勤'
              })
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).rejects.toThrow('OpenAI returned invalid style_tags')
  })

  it('throws when a required field is empty after trimming', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: '   ',
                sub_category: '衬衫',
                color_category: '蓝色',
                style_tags: ['通勤']
              })
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).rejects.toThrow('OpenAI returned empty category')
  })

  it('trims strings and limits style tags to five', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: ' 上衣 ',
                sub_category: ' 衬衫 ',
                color_category: ' 蓝色 ',
                style_tags: [' 通勤 ', '', ' 简约', '基础款 ', ' 日常 ', ' clean ', ' extra ']
              })
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).resolves.toEqual({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤', '简约', '基础款', '日常', 'clean']
    })
  })
})
