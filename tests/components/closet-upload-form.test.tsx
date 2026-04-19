import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'

describe('ClosetUploadForm', () => {
  it('renders AI suggestions and submits edited values', () => {
    const onSubmit = vi.fn()

    render(
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

    fireEvent.change(screen.getByLabelText('分类'), { target: { value: '外套' } })
    fireEvent.change(screen.getByLabelText('风格标签'), { target: { value: '通勤, 极简' } })
    fireEvent.submit(screen.getByRole('button', { name: '保存到衣橱' }).closest('form')!)

    expect(onSubmit).toHaveBeenCalledWith({
      imageUrl: 'https://example.com/shirt.jpg',
      category: '外套',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤', '极简']
    })
  })
})
