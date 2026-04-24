import { describe, expect, it, vi } from 'vitest'
import { saveClosetItem } from '@/lib/closet/save-closet-item'

const insert = vi.fn()
const select = vi.fn()
const single = vi.fn()
const from = vi.fn(() => ({ insert }))
const createSupabaseServerClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => createSupabaseServerClient()
}))

describe('saveClosetItem', () => {
  it('inserts a closet item with snake_case columns and returns the new row', async () => {
    single.mockResolvedValue({ data: { id: 'item-1' }, error: null })
    select.mockReturnValue({ single })
    insert.mockReturnValue({ select })
    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(
      saveClosetItem({
        userId: 'user-1',
        imageUrl: 'https://example.com/shirt.jpg',
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      })
    ).resolves.toEqual({ id: 'item-1' })

    expect(from).toHaveBeenCalledWith('items')
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      image_url: 'https://example.com/shirt.jpg',
      category: '上装',
      sub_category: '衬衫',
      color_category: '蓝色',
      style_tags: ['通勤'],
      purchase_price: null,
      purchase_year: null,
      item_condition: null
    })
    expect(select).toHaveBeenCalledWith('id')
    expect(single).toHaveBeenCalled()
  })

  it('throws the insert error', async () => {
    const error = new Error('insert failed')
    single.mockResolvedValue({ data: null, error })
    select.mockReturnValue({ single })
    insert.mockReturnValue({ select })
    createSupabaseServerClient.mockResolvedValue({ from })

    await expect(
      saveClosetItem({
        userId: 'user-1',
        imageUrl: 'https://example.com/shirt.jpg',
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      })
    ).rejects.toThrow('insert failed')
  })
})
