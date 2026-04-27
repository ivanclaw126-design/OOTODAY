import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from '@/components/landing/landing-page'

const replace = vi.fn()
const refresh = vi.fn()
const signInWithOtp = vi.fn()
const verifyOtp = vi.fn()
const maybeSingle = vi.fn()
const upsert = vi.fn()
const eq = vi.fn(() => ({ maybeSingle }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select, upsert }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh })
}))

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp,
      verifyOtp
    },
    from
  })
}))

describe('LandingPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    replace.mockClear()
    refresh.mockClear()
    signInWithOtp.mockReset()
    verifyOtp.mockReset()
    maybeSingle.mockReset()
    upsert.mockReset()
    eq.mockClear()
    select.mockClear()
    from.mockClear()
  })

  it('renders the product promise and sign-in CTA', () => {
    render(<LandingPage magicLinkSent={false} authError={null} />)

    expect(screen.getByRole('heading', { name: 'OOTODAY' })).toBeInTheDocument()
    expect(screen.getByText('把衣橱先导进来，今天穿什么才会开始变简单。')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '邮箱地址' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '登录邮箱地址' })).toBeInTheDocument()
    expect(screen.getByText('使用其他密码')).toBeInTheDocument()
    expect(screen.getByText('手机号验证码登录')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '国家区号' })).toHaveValue('+86')
    expect(screen.getByRole('textbox', { name: '手机号' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送登录链接' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '邮箱密码登录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送短信验证码' })).toBeInTheDocument()
  })

  it('sends and verifies a phone OTP, then routes existing profiles to Today', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    verifyOtp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    upsert.mockResolvedValue({ error: null })

    render(<LandingPage magicLinkSent={false} authError={null} />)

    fireEvent.change(screen.getByRole('textbox', { name: '手机号' }), {
      target: { value: '138 0013 8000' }
    })
    fireEvent.click(screen.getByRole('button', { name: '发送短信验证码' }))

    await waitFor(() => {
      expect(signInWithOtp).toHaveBeenCalledWith({ phone: '+8613800138000' })
    })

    fireEvent.change(await screen.findByRole('textbox', { name: '6 位验证码' }), {
      target: { value: '123456' }
    })
    fireEvent.click(screen.getByRole('button', { name: '验证并登录' }))

    await waitFor(() => {
      expect(verifyOtp).toHaveBeenCalledWith({
        phone: '+8613800138000',
        token: '123456',
        type: 'sms'
      })
      expect(from).toHaveBeenCalledWith('profiles')
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          phone: '+8613800138000'
        }),
        { onConflict: 'id' }
      )
      expect(replace).toHaveBeenCalledWith('/today')
      expect(refresh).toHaveBeenCalled()
    })
  })
})
