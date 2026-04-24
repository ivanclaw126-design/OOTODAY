import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'

const upload = vi.fn()
const getPublicUrl = vi.fn(() => ({
  data: {
    publicUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/shirt.jpg'
  }
}))
const refresh = vi.fn()
const createObjectURL = vi.fn()
const revokeObjectURL = vi.fn()
const analyzeImportUrl = vi.fn()
const OriginalURL = globalThis.URL
const splitCollageFiles = [
  new File(['split-1'], 'collage-split-1.jpg', { type: 'image/jpeg' }),
  new File(['split-2'], 'collage-split-2.jpg', { type: 'image/jpeg' })
]

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload,
        getPublicUrl
      })
    }
  })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh })
}))

vi.mock('@/lib/beta/telemetry', () => ({
  sendBetaEventFromClient: vi.fn(),
  sendBetaIssueFromClient: vi.fn()
}))

vi.mock('@/components/beta/feedback-link', () => ({
  FeedbackLink: ({ label = '反馈' }: { label?: string }) => <span>{label}</span>
}))

vi.mock('@/components/closet/closet-collage-splitter', () => ({
  ClosetCollageSplitter: ({
    disabled,
    onSplitComplete
  }: {
    disabled?: boolean
    onSplitComplete: (files: File[]) => void
  }) => (
    <button type="button" disabled={disabled} onClick={() => onSplitComplete(splitCollageFiles)}>
      模拟拼图拆分
    </button>
  )
}))

describe('ClosetUploadCard', () => {
  beforeEach(() => {
    upload.mockReset()
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockClear()
    refresh.mockClear()
    analyzeImportUrl.mockReset()
    createObjectURL.mockReset()
    createObjectURL.mockImplementation((file: File) => `blob:${file.name}`)
    revokeObjectURL.mockReset()

    class MockURL extends OriginalURL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    }

    vi.stubGlobal('URL', MockURL)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('uploads one file and shows the AI confirmation form', async () => {
    const analyzeUpload = vi.fn().mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={vi.fn()}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByLabelText('分类')).toHaveValue('上装')
    expect(analyzeUpload).toHaveBeenCalledWith({
      imageUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/shirt.jpg'
    })
    expect(screen.getByText('当前正在处理第 1 / 1 张，这是这一轮的最后一张')).toBeInTheDocument()
  })

  it('prevents repeated file selections from starting parallel uploads', async () => {
    let resolveUpload: ((value: { error: null }) => void) | undefined
    upload.mockImplementation(
      () =>
        new Promise<{ error: null }>((resolve) => {
          resolveUpload = resolve
        })
    )

    const analyzeUpload = vi.fn().mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={vi.fn()}
      />
    )

    const input = screen.getByLabelText('选择衣物图片')
    const firstFile = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    const secondFile = new File(['fake-image-2'], 'coat.jpg', { type: 'image/jpeg' })

    fireEvent.change(input, { target: { files: [firstFile] } })
    fireEvent.change(input, { target: { files: [secondFile] } })

    await screen.findByText('AI 正在分析图片')
    expect(upload).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    resolveUpload?.({ error: null })

    await waitFor(() => {
      expect(analyzeUpload).toHaveBeenCalledTimes(1)
    })
  })

  it('saves the confirmed draft and refreshes the page', async () => {
    const analyzeUpload = vi.fn().mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })
    const saveItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await screen.findByLabelText('分类')
    fireEvent.click(screen.getByRole('button', { name: /外层/ }))
    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(saveItem).toHaveBeenCalledWith({
        imageUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/shirt.jpg',
        category: '外层',
        subCategory: '未知类型请手动选择',
        colorCategory: '蓝色',
        styleTags: ['通勤'],
        purchasePrice: null,
        purchaseYear: null,
        itemCondition: null
      })
    })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:shirt.jpg')
  })

  it('shows an error when saving fails', async () => {
    const analyzeUpload = vi.fn().mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })
    const saveItem = vi.fn().mockRejectedValue(new Error('save failed'))

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await screen.findByLabelText('分类')
    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    expect(await screen.findByText('保存失败，请稍后再试')).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('revokes the preview object URL when an in-progress flow is abandoned', async () => {
    let resolveUpload: ((value: { error: null }) => void) | undefined
    upload.mockImplementation(
      () =>
        new Promise<{ error: null }>((resolve) => {
          resolveUpload = resolve
        })
    )

    const analyzeUpload = vi.fn().mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })

    const { unmount } = render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={vi.fn()}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await screen.findByText('AI 正在分析图片')
    unmount()

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:shirt.jpg')

    resolveUpload?.({ error: null })
  })

  it('supports selecting multiple files and advances through the queue after each save', async () => {
    const analyzeUpload = vi
      .fn()
      .mockResolvedValueOnce({
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      })
      .mockResolvedValueOnce({
        category: '裤装',
        subCategory: '牛仔裤',
        colorCategory: '黑色',
        styleTags: ['日常']
      })
    const saveItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />
    )

    const firstFile = new File(['fake-image-1'], 'shirt.jpg', { type: 'image/jpeg' })
    const secondFile = new File(['fake-image-2'], 'pants.jpg', { type: 'image/jpeg' })

    fireEvent.change(screen.getByLabelText('选择衣物图片'), {
      target: { files: [firstFile, secondFile] }
    })

    expect(await screen.findByLabelText('分类')).toHaveValue('上装')
    expect(screen.getByText('当前正在处理第 1 / 2 张，后面还有 1 张排队')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(saveItem).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByLabelText('分类')).toHaveValue('下装')
    })
    expect(screen.getByText('当前正在处理第 2 / 2 张，这是这一轮的最后一张')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(saveItem).toHaveBeenCalledTimes(2)
    })

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(analyzeUpload).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:shirt.jpg')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pants.jpg')
    expect(screen.queryByText(/当前正在处理第/)).not.toBeInTheDocument()
  })

  it('refreshes once when earlier items were saved and the last queued item is skipped', async () => {
    const analyzeUpload = vi
      .fn()
      .mockResolvedValueOnce({
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      })
      .mockResolvedValueOnce({
        category: '裙装',
        subCategory: '半裙',
        colorCategory: '灰色',
        styleTags: ['通勤']
      })
    const saveItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />
    )

    const firstFile = new File(['fake-image-1'], 'shirt.jpg', { type: 'image/jpeg' })
    const secondFile = new File(['fake-image-2'], 'skirt.jpg', { type: 'image/jpeg' })

    fireEvent.change(screen.getByLabelText('选择衣物图片'), {
      target: { files: [firstFile, secondFile] }
    })

    await screen.findByLabelText('分类')
    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await screen.findByLabelText('分类')
    fireEvent.click(screen.getByRole('button', { name: '跳过这张' }))

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1)
    })
    expect(saveItem).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/当前正在处理第/)).not.toBeInTheDocument()
  })

  it('imports one item from a product link and enters the shared confirmation flow', async () => {
    analyzeImportUrl.mockResolvedValue({
      error: null,
      draft: {
        imageUrl: 'https://cdn.example.com/item.jpg',
        category: '外套',
        subCategory: '西装外套',
        colorCategory: '米色',
        styleTags: ['通勤']
      }
    })
    const saveItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={vi.fn()}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />
    )

    fireEvent.change(screen.getByLabelText('衣物商品链接或图片链接'), {
      target: { value: 'https://shop.example.com/item/1' }
    })
    fireEvent.click(screen.getByRole('button', { name: '通过链接导入' }))

    await waitFor(() => {
      expect(screen.getByLabelText('分类')).toHaveValue('外层')
    })
    expect(analyzeImportUrl).toHaveBeenCalledWith({ sourceUrl: 'https://shop.example.com/item/1' })

    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(saveItem).toHaveBeenCalledWith({
        imageUrl: 'https://cdn.example.com/item.jpg',
        category: '外层',
        subCategory: '西装外套',
        colorCategory: '米色',
        styleTags: ['通勤'],
        purchasePrice: null,
        purchaseYear: null,
        itemCondition: null
      })
    })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('feeds collage split results back into the same local upload queue', async () => {
    const analyzeUpload = vi
      .fn()
      .mockResolvedValueOnce({
        category: '上衣',
        subCategory: '针织衫',
        colorCategory: '白色',
        styleTags: ['日常']
      })
      .mockResolvedValueOnce({
        category: '外套',
        subCategory: '夹克',
        colorCategory: '卡其色',
        styleTags: ['休闲']
      })
    const saveItem = vi.fn().mockResolvedValue(undefined)

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '模拟拼图拆分' }))

    expect(await screen.findByLabelText('分类')).toHaveValue('上装')
    expect(screen.getByText('当前正在处理第 1 / 2 张，后面还有 1 张排队')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(screen.getByLabelText('分类')).toHaveValue('外层')
    })
    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(saveItem).toHaveBeenCalledTimes(2)
    })
    expect(analyzeUpload).toHaveBeenCalledTimes(2)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(splitCollageFiles[0])
    expect(createObjectURL).toHaveBeenCalledWith(splitCollageFiles[1])
  })
})
