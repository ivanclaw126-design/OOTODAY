import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const lookup = vi.fn()
const upload = vi.fn()
const getPublicUrl = vi.fn()
const createSupabaseAdminClient = vi.fn(() => ({
  storage: {
    from: vi.fn(() => ({
      upload,
      getPublicUrl
    }))
  }
}))

vi.mock('node:dns/promises', () => ({
  default: {
    lookup
  },
  lookup
}))

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient
}))

vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    storageBucket: 'ootd-images'
  })
}))

describe('importRemoteImageToStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T14:00:00Z'))
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(Uint8Array.from([1, 2, 3]), {
          status: 200,
          headers: {
            'content-type': 'image/jpeg',
            'content-length': '3'
          }
        })
      })
    )
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/remote-imports/imported.jpg'
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetAllMocks()
    vi.resetModules()
  })

  it('allows relay DNS answers for public hostnames and uploads the image', async () => {
    lookup.mockResolvedValue([{ address: '198.18.1.167', family: 4 }])

    const { importRemoteImageToStorage } = await import('@/lib/closet/import-remote-image-to-storage')

    await expect(
      importRemoteImageToStorage({
        sourceUrl: 'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=900&q=80',
        userId: 'user-1'
      })
    ).resolves.toEqual({
      imageUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/remote-imports/imported.jpg',
      objectPath: expect.stringMatching(/^user-1\/remote-imports\/\d+-.+\.jpg$/),
      contentType: 'image/jpeg'
    })

    expect(lookup).toHaveBeenCalledWith('images.unsplash.com', {
      all: true,
      verbatim: true
    })
    expect(upload).toHaveBeenCalledOnce()
  })

  it('still blocks hostnames that resolve to local or private addresses', async () => {
    lookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }])

    const { importRemoteImageToStorage } = await import('@/lib/closet/import-remote-image-to-storage')

    await expect(
      importRemoteImageToStorage({
        sourceUrl: 'https://example.com/item.jpg',
        userId: 'user-1'
      })
    ).rejects.toThrow('暂不支持解析本地或内网地址')

    expect(upload).not.toHaveBeenCalled()
  })

  it('still blocks direct local hostnames before DNS relay handling kicks in', async () => {
    const { importRemoteImageToStorage } = await import('@/lib/closet/import-remote-image-to-storage')

    await expect(
      importRemoteImageToStorage({
        sourceUrl: 'http://127.0.0.1:3000/item.jpg',
        userId: 'user-1'
      })
    ).rejects.toThrow('暂不支持解析本地或内网地址')

    expect(lookup).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
  })
})
