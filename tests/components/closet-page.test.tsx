import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClosetPage } from '@/components/closet/closet-page'

const analyzeUpload = vi.fn()
const saveItem = vi.fn()

describe('ClosetPage', () => {
  it('shows the upload entry when no items exist', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={0}
        items={[]}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        saveItem={saveItem}
      />
    )

    expect(screen.getByText('先把第一件衣物放进来')).toBeInTheDocument()
    expect(screen.getByLabelText('选择衣物图片')).toBeInTheDocument()
  })

  it('shows recent saved items when items exist', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={2}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            createdAt: '2026-04-19T12:00:00Z'
          },
          {
            id: 'item-2',
            imageUrl: null,
            category: '裤装',
            subCategory: '西裤',
            colorCategory: '黑色',
            styleTags: ['极简'],
            createdAt: '2026-04-19T12:05:00Z'
          }
        ]}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        saveItem={saveItem}
      />
    )

    expect(screen.getByText('已收录 2 件单品')).toBeInTheDocument()
    expect(screen.getByText('上衣')).toBeInTheDocument()
    expect(screen.getByText('衬衫')).toBeInTheDocument()
    expect(screen.getByText('蓝色')).toBeInTheDocument()
    expect(screen.getByText('裤装')).toBeInTheDocument()
    expect(screen.getByText('西裤')).toBeInTheDocument()
    expect(screen.getByText('黑色')).toBeInTheDocument()
    expect(screen.getByText('暂无图片')).toBeInTheDocument()
  })
})
