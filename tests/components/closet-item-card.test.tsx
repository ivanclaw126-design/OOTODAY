import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClosetItemCard } from '@/components/closet/closet-item-card'

describe('ClosetItemCard', () => {
  it('renders the persisted image URL without applying an extra rotation class', () => {
    render(
      <ClosetItemCard
        item={{
          id: 'item-1',
          imageUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/top-rotated.jpg',
          imageFlipped: true,
          imageOriginalUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/top-original.jpg',
          imageRotationQuarterTurns: 1,
          imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
          canRestoreOriginal: true,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '蓝色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T12:00:00Z'
        }}
      />
    )

    const image = screen.getByAltText('上装 蓝色')
    expect(decodeURIComponent(image.getAttribute('src') ?? '')).toContain('/storage/v1/render/image/public/ootd-images/user-1/top-rotated.jpg')
    expect(image.className).not.toContain('rotate-90')
  })

  it('keeps right rotate available and exposes restore while the restore window is active', () => {
    const onRotateImage = vi.fn()
    const onRestoreOriginalImage = vi.fn()

    render(
      <ClosetItemCard
        item={{
          id: 'item-1',
          imageUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/top-rotated.jpg',
          imageFlipped: true,
          imageOriginalUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/top-original.jpg',
          imageRotationQuarterTurns: 2,
          imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
          canRestoreOriginal: true,
          category: '上装',
          subCategory: '衬衫',
          colorCategory: '蓝色',
          styleTags: ['通勤'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-04-19T12:00:00Z'
        }}
        onRotateImage={onRotateImage}
        onRestoreOriginalImage={onRestoreOriginalImage}
      />
    )

    expect(screen.getByRole('button', { name: '右转 90°' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '恢复原图' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '恢复原图' }))
    fireEvent.click(screen.getByRole('button', { name: '确认恢复' }))

    expect(onRestoreOriginalImage).toHaveBeenCalledTimes(1)
    expect(onRotateImage).not.toHaveBeenCalled()
  })
})
