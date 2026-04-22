import { afterEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const analyzeItemImage = vi.fn()
const saveClosetItem = vi.fn()
const deleteClosetItem = vi.fn()
const resolveShopInput = vi.fn()
const revalidatePath = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/closet/analyze-item-image', () => ({
  analyzeItemImage
}))

vi.mock('@/lib/shop/resolve-shop-input', () => ({
  resolveShopInput
}))

vi.mock('@/lib/closet/save-closet-item', () => ({
  saveClosetItem
}))

vi.mock('@/lib/closet/delete-closet-item', () => ({
  deleteClosetItem
}))

const validImageUrl = 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/fixed-id.jpg'
const validDraft = {
  imageUrl: validImageUrl,
  category: '上衣',
  subCategory: '衬衫',
  colorCategory: '蓝色',
  styleTags: ['通勤']
}

function stubClosetEnv() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
  vi.stubEnv('NEXT_PUBLIC_STORAGE_BUCKET', 'ootd-images')
}

afterEach(() => {
  getSession.mockReset()
  analyzeItemImage.mockReset()
  saveClosetItem.mockReset()
  deleteClosetItem.mockReset()
  resolveShopInput.mockReset()
  revalidatePath.mockReset()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('analyzeClosetUploadAction', () => {
  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null)

    const { analyzeClosetUploadAction } = await import('@/app/closet/actions')

    await expect(analyzeClosetUploadAction({ imageUrl: 'https://example.com/shirt.jpg' })).rejects.toThrow('Unauthorized')
  })

  it('rejects URLs outside the current user bucket path', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { analyzeClosetUploadAction } = await import('@/app/closet/actions')

    await expect(analyzeClosetUploadAction({ imageUrl: 'https://example.com/user-2/shirt.jpg' })).rejects.toThrow(
      'Invalid closet upload URL'
    )
  })

  it('rejects URLs from a different Supabase host', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { analyzeClosetUploadAction } = await import('@/app/closet/actions')

    await expect(
      analyzeClosetUploadAction({
        imageUrl: 'https://evil.supabase.co/storage/v1/object/public/ootd-images/user-1/fixed-id.jpg'
      })
    ).rejects.toThrow('Invalid closet upload URL')
  })

  it('delegates to analyzeItemImage for the current user upload URL', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    analyzeItemImage.mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })

    const { analyzeClosetUploadAction } = await import('@/app/closet/actions')

    await expect(analyzeClosetUploadAction({ imageUrl: validImageUrl })).resolves.toEqual({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })
    expect(analyzeItemImage).toHaveBeenCalledWith(validImageUrl)
  })
})

describe('saveClosetItemAction', () => {
  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null)

    const { saveClosetItemAction } = await import('@/app/closet/actions')

    await expect(saveClosetItemAction(validDraft)).rejects.toThrow('Unauthorized')
  })

  it('rejects invalid upload URLs', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { saveClosetItemAction } = await import('@/app/closet/actions')

    await expect(
      saveClosetItemAction({
        ...validDraft,
        imageUrl: 'https://example.com/storage/v1/object/public/ootd-images/user-1/fixed-id.jpg'
      })
    ).rejects.toThrow('Invalid closet upload URL')
  })

  it('saves the draft for the current user and revalidates closet', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveClosetItem.mockResolvedValue({ id: 'item-1' })

    const { saveClosetItemAction } = await import('@/app/closet/actions')

    await expect(saveClosetItemAction(validDraft)).resolves.toEqual({ id: 'item-1' })
    expect(saveClosetItem).toHaveBeenCalledWith({
      ...validDraft,
      userId: 'user-1'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/closet')
  })

  it('also saves valid external image urls resolved from remote imports', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveClosetItem.mockResolvedValue({ id: 'item-remote-1' })

    const { saveClosetItemAction } = await import('@/app/closet/actions')

    await expect(
      saveClosetItemAction({
        ...validDraft,
        imageUrl: 'https://cdn.example.com/item.jpg'
      })
    ).resolves.toEqual({ id: 'item-remote-1' })
    expect(saveClosetItem).toHaveBeenCalledWith({
      ...validDraft,
      imageUrl: 'https://cdn.example.com/item.jpg',
      userId: 'user-1'
    })
  })

  it('rejects private external image urls', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { saveClosetItemAction } = await import('@/app/closet/actions')

    await expect(
      saveClosetItemAction({
        ...validDraft,
        imageUrl: 'http://127.0.0.1/item.jpg'
      })
    ).rejects.toThrow('Invalid closet upload URL')
  })

  it('deletes a saved closet item for the current user and revalidates closet', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    deleteClosetItem.mockResolvedValue(undefined)

    const { deleteClosetItemAction } = await import('@/app/closet/actions')

    await expect(deleteClosetItemAction({ itemId: 'item-1' })).resolves.toBeUndefined()
    expect(deleteClosetItem).toHaveBeenCalledWith({
      userId: 'user-1',
      itemId: 'item-1'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/closet')
  })
})

describe('analyzeClosetImportUrlAction', () => {
  it('resolves a product link into a draft that can enter the closet flow', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://cdn.example.com/item.jpg',
      sourceTitle: '亚麻西装',
      sourceUrl: 'https://shop.example.com/item/1'
    })
    analyzeItemImage.mockResolvedValue({
      category: '外套',
      subCategory: '西装外套',
      colorCategory: '米色',
      styleTags: ['通勤']
    })

    const { analyzeClosetImportUrlAction } = await import('@/app/closet/actions')

    await expect(analyzeClosetImportUrlAction({ sourceUrl: 'https://shop.example.com/item/1' })).resolves.toEqual({
      error: null,
      draft: {
        imageUrl: 'https://cdn.example.com/item.jpg',
        category: '外套',
        subCategory: '西装外套',
        colorCategory: '米色',
        styleTags: ['通勤']
      }
    })
  })

  it('passes through resolve errors for unsupported remote inputs', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: '淘宝链接当前会跳登录拦截，请先贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    })

    const { analyzeClosetImportUrlAction } = await import('@/app/closet/actions')

    await expect(analyzeClosetImportUrlAction({ sourceUrl: 'https://item.taobao.com/item.htm?id=1' })).resolves.toEqual({
      error: '淘宝链接当前会跳登录拦截，请先贴商品图片链接',
      draft: null
    })
  })
})
