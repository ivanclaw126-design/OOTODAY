import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/components/landing/landing-page'

describe('LandingPage', () => {
  it('renders the product promise and sign-in CTA', () => {
    render(<LandingPage magicLinkSent={false} />)

    expect(screen.getByRole('heading', { name: 'OOTODAY' })).toBeInTheDocument()
    expect(screen.getByText('最低成本导入你的真实衣橱')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '邮箱地址' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送登录链接' })).toBeInTheDocument()
  })
})
