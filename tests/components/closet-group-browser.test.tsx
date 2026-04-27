import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ClosetGroupBrowser, buildClosetBrowseGroups } from '@/components/closet/closet-group-browser'
import type { ClosetItemCardData } from '@/lib/closet/types'

function createItem(overrides: Partial<ClosetItemCardData> = {}): ClosetItemCardData {
  return {
    id: 'item-1',
    imageUrl: 'https://example.com/rotated-shorts.jpg',
    imageFlipped: true,
    imageOriginalUrl: 'https://example.com/original-shorts.jpg',
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
  afterEach(() => {
    cleanup()
  })

  it('renders group thumbnails with contain fit so rotated images stay visible', () => {
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

    const thumbnail = screen.getByAltText('下装 缩略图')
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/rotated-shorts.jpg')
    expect(thumbnail.className).toContain('object-contain')
    expect(thumbnail.className).not.toContain('object-cover')
  })

  it('refreshes group thumbnail URLs when users tap refresh images', () => {
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

    expect(screen.getByRole('button', { name: '刷新图片' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '刷新图片' }))

    expect(screen.getByAltText('下装 缩略图')).toHaveAttribute('src', 'https://example.com/rotated-shorts.jpg?r=1')
    expect(screen.getByRole('button', { name: '刷新中…' })).toBeDisabled()
  })

  it('keeps missing-image placeholders unchanged when users refresh thumbnails', () => {
    const groups = buildClosetBrowseGroups([createItem({ imageUrl: null })], 'category')

    render(
      <ClosetGroupBrowser
        groups={groups}
        mode="category"
        activeGroupValue={null}
        onSelectGroup={() => {}}
        onClearGroup={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '刷新图片' }))

    expect(screen.getByText('暂无图')).toBeInTheDocument()
  })
})
