import { afterEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const analyzeItemImage = vi.fn()
const saveClosetItem = vi.fn()
const deleteClosetItem = vi.fn()
const importRemoteImageToStorage = vi.fn()
const replaceClosetItemImage = vi.fn()
const resolveShopInput = vi.fn()
const revalidatePath = vi.fn()
const setClosetItemImageFlip = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/closet/analyze-item-image', () => ({
  analyzeItemImage
}))

vi.mock('@/lib/closet/import-remote-image-to-storage', () => ({
  importRemoteImageToStorage
}))

vi.mock('@/lib/shop/resolve-shop-input', () => ({
  resolveShopInput
}))

vi.mock('@/lib/closet/save-closet-item', () => ({
  saveClosetItem
}))

vi.mock('@/lib/closet/replace-closet-item-image', () => ({
  replaceClosetItemImage
}))

vi.mock('@/lib/closet/set-closet-item-image-flip', () => ({
  setClosetItemImageFlip
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
  importRemoteImageToStorage.mockReset()
  replaceClosetItemImage.mockReset()
  resolveShopInput.mockReset()
  setClosetItemImageFlip.mockReset()
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
      category: '上装',
      userId: 'user-1'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/closet')
  })

  it('rejects remote image urls that were not rehosted into the current user storage path', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    stubClosetEnv()

    const { saveClosetItemAction } = await import('@/app/closet/actions')

    await expect(
      saveClosetItemAction({
        ...validDraft,
        imageUrl: 'https://cdn.example.com/item.jpg'
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
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://cdn.example.com/item.jpg',
      sourceTitle: '亚麻西装',
      sourceUrl: 'https://shop.example.com/item/1'
    })
    importRemoteImageToStorage.mockResolvedValue({
      imageUrl: validImageUrl,
      objectPath: 'user-1/remote-imports/item.jpg',
      contentType: 'image/jpeg'
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
        imageUrl: validImageUrl,
        category: '外层',
        subCategory: '西装外套',
        colorCategory: '米色',
        styleTags: ['通勤']
      }
    })
    expect(importRemoteImageToStorage).toHaveBeenCalledWith({
      sourceUrl: 'https://cdn.example.com/item.jpg',
      userId: 'user-1'
    })
    expect(analyzeItemImage).toHaveBeenCalledWith(validImageUrl)
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

  it('returns remote import errors when rehosting the image fails safety checks', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    resolveShopInput.mockResolvedValue({
      error: null,
      imageUrl: 'https://cdn.example.com/item.jpg',
      sourceTitle: '亚麻西装',
      sourceUrl: 'https://shop.example.com/item/1'
    })
    importRemoteImageToStorage.mockRejectedValue(new Error('暂不支持解析本地或内网地址'))

    const { analyzeClosetImportUrlAction } = await import('@/app/closet/actions')

    await expect(analyzeClosetImportUrlAction({ sourceUrl: 'https://shop.example.com/item/1' })).resolves.toEqual({
      error: '暂不支持解析本地或内网地址',
      draft: null
    })
    expect(analyzeItemImage).not.toHaveBeenCalled()
  })
})

describe('updateClosetItemImageRotationAction', () => {
  it('rotates the image clockwise for the current user and revalidates dependent pages', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    setClosetItemImageFlip.mockResolvedValue({
      id: 'item-1',
      imageUrl: validImageUrl,
      imageFlipped: true,
      imageOriginalUrl: 'https://example.com/original.jpg',
      imageRotationQuarterTurns: 1,
      imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
      canRestoreOriginal: true,
      persisted: true
    })

    const { updateClosetItemImageRotationAction } = await import('@/app/closet/actions')

    await expect(updateClosetItemImageRotationAction({ itemId: 'item-1', operation: 'rotate-right-90' })).resolves.toEqual({
      id: 'item-1',
      imageUrl: validImageUrl,
      imageFlipped: true,
      imageOriginalUrl: 'https://example.com/original.jpg',
      imageRotationQuarterTurns: 1,
      imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
      canRestoreOriginal: true,
      persisted: true
    })
    expect(setClosetItemImageFlip).toHaveBeenCalledWith({
      userId: 'user-1',
      itemId: 'item-1',
      operation: 'rotate-right-90'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/closet')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
    expect(revalidatePath).toHaveBeenCalledWith('/travel')
    expect(revalidatePath).toHaveBeenCalledWith('/looks')
    expect(revalidatePath).toHaveBeenCalledWith('/shop')
  })
})

describe('replaceClosetItemImageAction', () => {
  it('replaces the current user item image and revalidates dependent pages', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    replaceClosetItemImage.mockResolvedValue({
      id: 'item-1',
      imageUrl: validImageUrl,
      imageOriginalUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/old.jpg',
      imageRotationQuarterTurns: 1,
      imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
      canRestoreOriginal: true,
      persisted: true
    })

    const { replaceClosetItemImageAction } = await import('@/app/closet/actions')

    await expect(replaceClosetItemImageAction({ itemId: 'item-1', draft: validDraft })).resolves.toEqual({
      id: 'item-1',
      imageUrl: validImageUrl,
      imageOriginalUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/old.jpg',
      imageRotationQuarterTurns: 1,
      imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
      canRestoreOriginal: true,
      persisted: true
    })
    expect(replaceClosetItemImage).toHaveBeenCalledWith({
      ...validDraft,
      category: '上装',
      userId: 'user-1',
      itemId: 'item-1'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/closet')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
    expect(revalidatePath).toHaveBeenCalledWith('/travel')
    expect(revalidatePath).toHaveBeenCalledWith('/looks')
    expect(revalidatePath).toHaveBeenCalledWith('/shop')
  })

  it('rejects replacement image urls outside the current user bucket path', async () => {
    stubClosetEnv()
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { replaceClosetItemImageAction } = await import('@/app/closet/actions')

    await expect(
      replaceClosetItemImageAction({
        itemId: 'item-1',
        draft: {
          ...validDraft,
          imageUrl: 'https://cdn.example.com/item.jpg'
        }
      })
    ).rejects.toThrow('Invalid closet upload URL')
    expect(replaceClosetItemImage).not.toHaveBeenCalled()
  })
})
