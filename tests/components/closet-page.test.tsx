import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { ClosetPage } from '@/components/closet/closet-page'

const analyzeUpload = vi.fn()
const analyzeImportUrl = vi.fn()
const saveItem = vi.fn()
const deleteItem = vi.fn()
const updateItem = vi.fn()
const reanalyzeItem = vi.fn()
const toggleImageFlip = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      })
    }
  })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/closet'
}))

describe('ClosetPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the upload entry when no items exist', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={0}
        items={[]}
        insights={{ duplicateGroups: [], idleItems: [], missingBasics: [], actionPlan: [] }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
        toggleImageFlip={toggleImageFlip}
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
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          },
          {
            id: 'item-2',
            imageUrl: null,
            category: '裤装',
            subCategory: '西裤',
            colorCategory: '黑色',
            styleTags: ['极简'],
            lastWornDate: '2026-04-20',
            wearCount: 2,
            createdAt: '2026-04-19T12:05:00Z'
          }
        ]}
        insights={{
          duplicateGroups: [
            {
              id: 'duplicate-top',
              label: '灰色 短袖T恤',
              count: 2,
              itemIds: ['item-1'],
              keepItemId: 'item-1',
              keepLabel: '灰色 短袖T恤',
              keepReason: '这件已经穿过 2 次，说明它更像你真的会反复拿出来穿的版本'
            }
          ],
          idleItems: [
            {
              id: 'idle-1',
              label: '黑色 西裤',
              reason: '收录后还没真正穿出去过'
            }
          ],
          missingBasics: [
            {
              id: 'missing-1',
              label: '可叠穿外套',
              reason: '天气变化和层次搭配都需要一件外套来做切换',
              priority: 'medium',
              nextStep: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算'
            }
          ],
          actionPlan: [
            {
              id: 'action:missing-1',
              title: '先补 可叠穿外套',
              detail: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算',
              filterId: 'missing-1',
              tone: 'buy'
            }
          ]
        }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
        toggleImageFlip={toggleImageFlip}
      />
    )

    expect(screen.getByText('已收录 2 件单品')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '展开' })).toHaveLength(2)
    expect(screen.getByText('上装')).toBeInTheDocument()
    expect(screen.getByText('衬衫')).toBeInTheDocument()
    expect(screen.getByText('蓝色')).toBeInTheDocument()
    expect(screen.getByText('下装')).toBeInTheDocument()
    expect(screen.getByText('西裤')).toBeInTheDocument()
    expect(screen.getByText('黑色')).toBeInTheDocument()
    expect(screen.getByText('暂无图片')).toBeInTheDocument()
    expect(screen.getAllByText('整理建议').length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole('button', { name: '展开' })[1])
    expect(screen.getByText('下一步先做这些')).toBeInTheDocument()
    expect(screen.getByText('1. 先补 可叠穿外套')).toBeInTheDocument()
    expect(screen.getByText('优先保留：灰色 短袖T恤')).toBeInTheDocument()
    expect(screen.getByText(/黑色 西裤/)).toBeInTheDocument()
    expect(screen.getByText('可叠穿外套')).toBeInTheDocument()
    expect(screen.getByText('优先保留：灰色 短袖T恤')).toBeInTheDocument()
    expect(screen.getByText('优先级：中')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '删除这件衣物' })).toHaveLength(2)
  })

  it('filters the closet grid from organizing suggestions and can clear the filter', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={2}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '短袖T恤',
            colorCategory: '灰色',
            styleTags: ['基础'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          },
          {
            id: 'item-2',
            imageUrl: null,
            category: '裤装',
            subCategory: '西裤',
            colorCategory: '黑色',
            styleTags: ['通勤'],
            lastWornDate: '2026-04-20',
            wearCount: 2,
            createdAt: '2026-04-19T12:05:00Z'
          }
        ]}
        insights={{
          duplicateGroups: [
            {
              id: 'duplicate-top',
              label: '灰色 短袖T恤',
              count: 2,
              itemIds: ['item-1'],
              keepItemId: 'item-1',
              keepLabel: '灰色 短袖T恤',
              keepReason: '这件已经穿过 2 次，说明它更像你真的会反复拿出来穿的版本'
            }
          ],
          idleItems: [],
          missingBasics: [
            {
              id: 'outerwear',
              label: '可叠穿外套',
              reason: '天气变化和层次搭配都需要一件外套来做切换',
              priority: 'medium',
              nextStep: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算'
            }
          ],
          actionPlan: [
            {
              id: 'action:outerwear',
              title: '先补 可叠穿外套',
              detail: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算',
              filterId: 'outerwear',
              tone: 'buy'
            }
          ]
        }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
        toggleImageFlip={toggleImageFlip}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: '展开' })[1])
    fireEvent.click(screen.getByRole('button', { name: /灰色 短袖T恤/ }))
    expect(screen.getAllByText('短袖T恤')).toHaveLength(1)
    expect(screen.queryByText('西裤')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看全部' }))
    expect(screen.getByText('西裤')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /可叠穿外套/ })[1])
    expect(screen.getByText('可叠穿外套 当前还没补进衣橱')).toBeInTheDocument()
    expect(screen.getAllByText('天气变化和层次搭配都需要一件外套来做切换').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: '查看全部' }))
    expect(screen.getByText('西裤')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /可叠穿外套/ })[0])
    expect(screen.getByText('可叠穿外套 当前还没补进衣橱')).toBeInTheDocument()
  })

  it('confirms before deleting a saved item', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteItem.mockResolvedValue(undefined)

    render(
      <ClosetPage
        userId="user-1"
        itemCount={1}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          }
        ]}
        insights={{ duplicateGroups: [], idleItems: [], missingBasics: [], actionPlan: [] }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
        toggleImageFlip={toggleImageFlip}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '删除这件衣物' }))
    expect(confirm).toHaveBeenCalled()
    expect(deleteItem).toHaveBeenCalledWith({ itemId: 'item-1' })
  })

  it('toggles image flip for a saved item', async () => {
    toggleImageFlip.mockResolvedValue(undefined)

    render(
      <ClosetPage
        userId="user-1"
        itemCount={1}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            imageFlipped: false,
            category: '上装',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          }
        ]}
        insights={{ duplicateGroups: [], idleItems: [], missingBasics: [], actionPlan: [] }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
        toggleImageFlip={toggleImageFlip}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '向右翻转图片' }))

    await waitFor(() => {
      expect(toggleImageFlip).toHaveBeenCalledWith({
        itemId: 'item-1',
        imageFlipped: true
      })
    })
  })

  it('opens the edit panel immediately when editing a saved item', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={1}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          }
        ]}
        insights={{ duplicateGroups: [], idleItems: [], missingBasics: [], actionPlan: [] }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '编辑识别结果' }))

    const dialog = screen.getByRole('dialog', { name: '编辑识别结果' })

    expect(dialog).toBeInTheDocument()
    expect(dialog.className).toContain('overflow-hidden')
    expect(screen.getByLabelText('分类')).toHaveValue('上装')
    expect(screen.getByLabelText('子分类')).toHaveValue('衬衫')
  })

  it('shows the refreshed draft in the edit panel after reanalyzing', async () => {
    reanalyzeItem.mockResolvedValueOnce({
      imageUrl: 'https://example.com/top.jpg',
      category: '外套',
      subCategory: '西装外套',
      colorCategory: '卡其色',
      styleTags: ['通勤']
    })

    render(
      <ClosetPage
        userId="user-1"
        itemCount={1}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          }
        ]}
        insights={{ duplicateGroups: [], idleItems: [], missingBasics: [], actionPlan: [] }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '一键重新识别' }))

    expect(screen.getByRole('dialog', { name: '编辑识别结果' })).toBeInTheDocument()
    expect(reanalyzeItem).toHaveBeenCalledWith({ itemId: 'item-1' })

    await waitFor(() => {
      expect(screen.getByLabelText('分类')).toHaveValue('外套')
      expect(screen.getByLabelText('子分类')).toHaveValue('西装外套')
      expect(screen.getByLabelText('颜色')).toHaveValue('卡其色')
    })
  })

  it('supports grouped browsing by category and color', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={3}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:00:00Z'
          },
          {
            id: 'item-2',
            imageUrl: 'https://example.com/coat.jpg',
            category: '外套',
            subCategory: '西装外套',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:01:00Z'
          },
          {
            id: 'item-3',
            imageUrl: 'https://example.com/pants.jpg',
            category: '裤装',
            subCategory: '西裤',
            colorCategory: '黑色',
            styleTags: ['极简'],
            lastWornDate: null,
            wearCount: 0,
            createdAt: '2026-04-19T12:02:00Z'
          }
        ]}
        insights={{ duplicateGroups: [], idleItems: [], missingBasics: [], actionPlan: [] }}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
        updateItem={updateItem}
        reanalyzeItem={reanalyzeItem}
        deleteItem={deleteItem}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '按类型' }))
    expect(screen.getAllByText('上衣').length).toBeGreaterThan(0)
    expect(screen.getAllByText('外套').length).toBeGreaterThan(0)
    expect(screen.getAllByText('裤装').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: '按颜色' }))
    expect(screen.getAllByText('蓝色').length).toBeGreaterThan(0)
    expect(screen.getAllByText('黑色').length).toBeGreaterThan(0)
  })
})
