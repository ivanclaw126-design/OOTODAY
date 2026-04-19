import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClosetPage } from '@/components/closet/closet-page'

describe('ClosetPage', () => {
  it('shows the empty-state CTA when no items exist', () => {
    render(<ClosetPage itemCount={0} />)

    expect(screen.getByText('先把第一件衣物放进来')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '上传入口即将接入' })).toBeInTheDocument()
  })

  it('shows the item count summary when items exist', () => {
    render(<ClosetPage itemCount={8} />)

    expect(screen.getByText('已收录 8 件单品')).toBeInTheDocument()
  })
})
