import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodayPage } from '@/components/today/today-page'

describe('TodayPage', () => {
  it('shows the upload prompt when the closet is empty', () => {
    render(<TodayPage itemCount={0} hasProfile={true} />)

    expect(screen.getByText('你的衣橱还是空的')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet')
  })

  it('shows recommendation placeholders when items exist', () => {
    render(<TodayPage itemCount={3} hasProfile={true} />)

    expect(screen.getByText('推荐功能即将接入')).toBeInTheDocument()
    expect(screen.getAllByText('Outfit placeholder')).toHaveLength(3)
  })
})
