import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'

const baseDraft = {
  imageUrl: 'https://example.com/shirt.jpg',
  category: '上衣',
  subCategory: '衬衫',
  colorCategory: '蓝色',
  styleTags: ['通勤', '简约']
}

afterEach(() => {
  cleanup()
})

describe('ClosetUploadForm', () => {
  it('renders AI suggestions and submits edited values', () => {
    const onSubmit = vi.fn()
    const { getByLabelText, getByRole } = render(<ClosetUploadForm initialDraft={baseDraft} onSubmit={onSubmit} />)

    fireEvent.change(getByLabelText('分类'), { target: { value: '外套' } })
    fireEvent.change(getByLabelText('风格标签'), { target: { value: '通勤, 极简' } })
    fireEvent.submit(getByRole('button', { name: '保存到衣橱' }).closest('form')!)

    expect(onSubmit).toHaveBeenCalledWith({
      imageUrl: 'https://example.com/shirt.jpg',
      category: '外套',
      subCategory: '未知类型请手动选择',
      colorCategory: '蓝色',
      styleTags: ['通勤', '极简']
    })
  })

  it('keeps local edits when initialDraft is rerendered with the same content', () => {
    const onSubmit = vi.fn()
    const { getByLabelText, rerender } = render(<ClosetUploadForm initialDraft={baseDraft} onSubmit={onSubmit} />)

    fireEvent.change(getByLabelText('分类'), { target: { value: '外套' } })
    fireEvent.change(getByLabelText('风格标签'), { target: { value: '通勤，极简' } })

    rerender(
      <ClosetUploadForm
        initialDraft={{
          imageUrl: 'https://example.com/shirt.jpg',
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '蓝色',
          styleTags: ['通勤', '简约']
        }}
        onSubmit={onSubmit}
      />
    )

    expect(getByLabelText('分类')).toHaveValue('外套')
    expect(getByLabelText('风格标签')).toHaveValue('通勤，极简')
  })

  it('normalizes style tags by trimming whitespace, dropping empties, and supporting Chinese commas', () => {
    const onSubmit = vi.fn()
    const { getByLabelText, getByRole } = render(<ClosetUploadForm initialDraft={baseDraft} onSubmit={onSubmit} />)

    fireEvent.change(getByLabelText('风格标签'), {
      target: { value: '  通勤， 极简 ,  , 法式  ,，  ' }
    })
    fireEvent.submit(getByRole('button', { name: '保存到衣橱' }).closest('form')!)

    expect(onSubmit).toHaveBeenCalledWith({
      imageUrl: 'https://example.com/shirt.jpg',
      category: '上装',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤', '极简', '法式']
    })
  })
})
