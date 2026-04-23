import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/components/landing/landing-page'

describe('LandingPage', () => {
  it('renders the product promise and sign-in CTA', () => {
    render(<LandingPage magicLinkSent={false} authError={null} />)

    expect(screen.getByRole('heading', { name: 'OOTODAY' })).toBeInTheDocument()
    expect(screen.getByText('把衣橱先导进来，今天穿什么才会开始变简单。')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '邮箱地址' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '登录邮箱地址' })).toBeInTheDocument()
    expect(screen.getByText('使用其他密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送登录链接' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '邮箱密码登录' })).toBeInTheDocument()
  })
})
