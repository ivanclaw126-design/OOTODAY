import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClosetCollageSplitter } from '@/components/closet/closet-collage-splitter'

const { splitCollageFile } = vi.hoisted(() => ({
  splitCollageFile: vi.fn()
}))
const createObjectURL = vi.fn()
const revokeObjectURL = vi.fn()
const OriginalURL = globalThis.URL

vi.mock('@/lib/closet/split-collage-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/closet/split-collage-client')>('@/lib/closet/split-collage-client')

  return {
    ...actual,
    splitCollageFile
  }
})

describe('ClosetCollageSplitter', () => {
  beforeEach(() => {
    splitCollageFile.mockReset()
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

  it('shows the selected collage preview and lets the user add up to four crop boxes', async () => {
    render(<ClosetCollageSplitter onSplitComplete={vi.fn()} />)

    const file = new File(['collage'], 'closet-collage.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择拼图图片'), { target: { files: [file] } })

    expect(await screen.findByAltText('拼图预览')).toHaveAttribute('src', 'blob:closet-collage.jpg')
    expect(screen.getAllByRole('button', { name: /^裁剪框 \d$/ })).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '新增裁剪框' }))
    fireEvent.click(screen.getByRole('button', { name: '新增裁剪框' }))

    expect(screen.getAllByRole('button', { name: /^裁剪框 \d$/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: '新增裁剪框' })).toBeDisabled()
  })

  it('splits the collage into files and clears the local editor after success', async () => {
    const onSplitComplete = vi.fn()
    const splitFiles = [
      new File(['one'], 'look-1.jpg', { type: 'image/jpeg' }),
      new File(['two'], 'look-2.jpg', { type: 'image/jpeg' })
    ]
    splitCollageFile.mockResolvedValue(splitFiles)

    render(<ClosetCollageSplitter onSplitComplete={onSplitComplete} />)

    const file = new File(['collage'], 'closet-collage.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择拼图图片'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: '拆成 2 张并继续导入' }))

    await waitFor(() => {
      expect(splitCollageFile).toHaveBeenCalledTimes(1)
    })
    expect(splitCollageFile).toHaveBeenCalledWith(
      file,
      expect.arrayContaining([
        expect.objectContaining({ id: 'crop-1' }),
        expect.objectContaining({ id: 'crop-2' })
      ])
    )
    expect(onSplitComplete).toHaveBeenCalledWith(splitFiles)
    expect(screen.queryByAltText('拼图预览')).not.toBeInTheDocument()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:closet-collage.jpg')
  })

  it('shows an inline error when the client-side split fails', async () => {
    splitCollageFile.mockRejectedValue(new Error('boom'))

    render(<ClosetCollageSplitter onSplitComplete={vi.fn()} />)

    const file = new File(['collage'], 'closet-collage.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择拼图图片'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: '拆成 2 张并继续导入' }))

    expect(await screen.findByText('拼图拆分失败，请调整裁剪框后重试')).toBeInTheDocument()
  })
})
