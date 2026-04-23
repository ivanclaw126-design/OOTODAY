import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('selectBestShopProductImage', () => {
  it('returns null when the OpenAI key is missing so callers can fall back to heuristics', async () => {
    const { selectBestShopProductImage } = await import('@/lib/shop/select-product-image')

    await expect(
      selectBestShopProductImage(['https://example.com/model.jpg', 'https://example.com/product.jpg'])
    ).resolves.toBeNull()
  })

  it('returns the AI-selected candidate index when the model responds with JSON', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                selected_index: 1
              })
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { selectBestShopProductImage } = await import('@/lib/shop/select-product-image')

    await expect(
      selectBestShopProductImage(['https://example.com/model.jpg', 'https://example.com/product.jpg'])
    ).resolves.toBe('https://example.com/product.jpg')
  })
})
