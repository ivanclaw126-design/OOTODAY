import { afterEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const resolveInspirationInput = vi.fn()
const analyzeInspirationImage = vi.fn()
const getClosetView = vi.fn()
const getPreferenceState = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/inspiration/resolve-inspiration-input', () => ({
  resolveInspirationInput
}))

vi.mock('@/lib/inspiration/analyze-inspiration-image', () => ({
  analyzeInspirationImage
}))

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/recommendation/get-preference-state', () => ({
  getPreferenceState
}))

afterEach(() => {
  getSession.mockReset()
  resolveInspirationInput.mockReset()
  analyzeInspirationImage.mockReset()
  getClosetView.mockReset()
  getPreferenceState.mockReset()
  vi.resetModules()
})

describe('analyzeInspirationAction', () => {
  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null)

    const { analyzeInspirationAction } = await import('@/app/inspiration/actions')

    await expect(analyzeInspirationAction({ sourceUrl: 'https://example.com/inspiration.jpg' })).rejects.toThrow(
      'Unauthorized'
    )
  })

  it('returns the parsed inspiration breakdown and closet matches', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveInspirationInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://example.com/inspiration.jpg',
      sourceTitle: 'Paris Street Look',
      sourceUrl: 'https://example.com/inspiration.jpg'
    })
    analyzeInspirationImage.mockResolvedValue({
      summary: '极简通勤感很强的一套黑白配色',
      scene: '适合工作日通勤',
      vibe: '利落',
      keyItems: [
        {
          id: 'item-1',
          label: '西装外套',
          category: '外套',
          colorHint: '黑色',
          styleTags: ['通勤']
        }
      ],
      stylingTips: ['保持线条干净']
    })
    getClosetView.mockResolvedValue({
      itemCount: 1,
      items: [
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
      ]
    })
    getPreferenceState.mockResolvedValue(null)

    const { analyzeInspirationAction } = await import('@/app/inspiration/actions')
    const result = await analyzeInspirationAction({ sourceUrl: 'https://example.com/inspiration.jpg' })

    expect(result.error).toBeNull()
    expect(result.analysis?.sourceTitle).toBe('Paris Street Look')
    expect(result.analysis?.breakdown.summary).toContain('黑白配色')
    expect(result.analysis?.closetMatches[0]?.matchedItems[0]?.id).toBe('coat-1')
    expect(result.analysis?.remixPlan.title).toBe('我的版本怎么穿')
    expect(result.analysis?.remixPlan.coverageLabel).toBe('复刻完成度高')
    expect(result.analysis?.remixPlan.steps[0]?.note).toContain('黑色 西装外套')
    expect(getPreferenceState).toHaveBeenCalledWith({ userId: 'user-1' })
  })
})
