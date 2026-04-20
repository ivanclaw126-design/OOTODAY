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

describe('ClosetUploadCard', () => {
  beforeEach(() => {
    upload.mockReset()
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockClear()
    refresh.mockClear()
    createObjectURL.mockReset()
    createObjectURL.mockReturnValue('blob:preview-1')
    revokeObjectURL.mockReset()

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL
    })
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
        saveItem={vi.fn()}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByDisplayValue('上衣')).toBeInTheDocument()
    expect(analyzeUpload).toHaveBeenCalledWith({
      imageUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/shirt.jpg'
    })
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
        saveItem={saveItem}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await screen.findByDisplayValue('上衣')
    fireEvent.change(screen.getByLabelText('分类'), { target: { value: '外套' } })
    fireEvent.click(screen.getByRole('button', { name: '保存到衣橱' }))

    await waitFor(() => {
      expect(saveItem).toHaveBeenCalledWith({
        imageUrl: 'https://example.supabase.co/storage/v1/object/public/ootd-images/user-1/shirt.jpg',
        category: '外套',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      })
    })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
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
        saveItem={saveItem}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await screen.findByDisplayValue('上衣')
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
        saveItem={vi.fn()}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    await screen.findByText('AI 正在分析图片')
    unmount()

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')

    resolveUpload?.({ error: null })
  })
})
