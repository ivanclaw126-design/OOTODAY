import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClosetGroupBrowser, buildClosetBrowseGroups } from '@/components/closet/closet-group-browser'
import type { ClosetItemCardData } from '@/lib/closet/types'

function createItem(overrides: Partial<ClosetItemCardData> = {}): ClosetItemCardData {
  return {
    id: 'item-1',
    imageUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/rotated-shorts.jpg',
    imageFlipped: true,
    imageOriginalUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/original-shorts.jpg',
    imageRotationQuarterTurns: 1,
    imageRestoreExpiresAt: '2099-04-24T12:30:00Z',
    canRestoreOriginal: true,
    category: '下装',
    subCategory: '短裤',
    colorCategory: '绿色',
    styleTags: ['休闲'],
    lastWornDate: null,
    wearCount: 0,
    createdAt: '2026-04-24T12:00:00Z',
    ...overrides
  }
}

describe('ClosetGroupBrowser', () => {
  it('defers group thumbnails until the group is active', () => {
    const groups = buildClosetBrowseGroups([createItem()], 'category')

    render(
      <ClosetGroupBrowser
        groups={groups}
        mode="category"
        activeGroupValue={null}
        onSelectGroup={() => {}}
        onClearGroup={() => {}}
      />
    )

    expect(screen.queryByAltText('下装 缩略图')).not.toBeInTheDocument()
  })

  it('renders at most two active group thumbnails with contain fit', () => {
    const groups = buildClosetBrowseGroups([
      createItem({ id: 'item-1', imageUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/rotated-shorts.jpg' }),
      createItem({ id: 'item-2', imageUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/second-shorts.jpg' }),
      createItem({ id: 'item-3', imageUrl: 'https://xaoqhaakrzolcyivqutn.supabase.co/storage/v1/object/public/ootd-images/user-1/third-shorts.jpg' })
    ], 'category')

    render(
      <ClosetGroupBrowser
        groups={groups}
        mode="category"
        activeGroupValue="下装"
        onSelectGroup={() => {}}
        onClearGroup={() => {}}
      />
    )

    const thumbnails = screen.getAllByAltText('下装 缩略图')
    const thumbnailUrls = thumbnails.map((thumbnail) => decodeURIComponent(thumbnail.getAttribute('src') ?? ''))
    const firstThumbnailSrcSet = decodeURIComponent(thumbnails[0].getAttribute('srcset') ?? '')

    expect(thumbnails).toHaveLength(2)
    expect(thumbnailUrls[0]).toContain('/storage/v1/render/image/public/ootd-images/user-1/rotated-shorts.jpg')
    expect(thumbnailUrls[1]).toContain('/storage/v1/render/image/public/ootd-images/user-1/second-shorts.jpg')
    expect(firstThumbnailSrcSet).toContain('width=128')
    expect(thumbnailUrls.some((src) => src.includes('third-shorts.jpg'))).toBe(false)
    const thumbnail = thumbnails[0]
    expect(thumbnail.className).toContain('object-contain')
    expect(thumbnail.className).not.toContain('object-cover')
  })
})
