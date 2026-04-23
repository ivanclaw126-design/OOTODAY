import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppChrome } from '@/components/app-chrome'

const push = vi.fn()
const prefetch = vi.fn()
const usePathnameMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({ push, prefetch })
}))

describe('AppChrome', () => {
  beforeEach(() => {
    push.mockReset()
    prefetch.mockReset()
    usePathnameMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the persistent bottom nav on app routes only', () => {
    usePathnameMock.mockReturnValue('/today')

    const { rerender } = render(
      <AppChrome>
        <div>page body</div>
      </AppChrome>
    )

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
    expect(prefetch).toHaveBeenCalledWith('/closet')

    usePathnameMock.mockReturnValue('/')
    rerender(
      <AppChrome>
        <div>landing</div>
      </AppChrome>
    )

    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument()
  })

  it('navigates between primary pages on a horizontal touch swipe', () => {
    usePathnameMock.mockReturnValue('/closet')

    const { container } = render(
      <AppChrome>
        <div>page body</div>
      </AppChrome>
    )

    const chrome = container.firstElementChild as HTMLDivElement

    fireEvent.touchStart(chrome, {
      touches: [{ clientX: 240, clientY: 320 }]
    })
    fireEvent.touchEnd(chrome, {
      changedTouches: [{ clientX: 120, clientY: 326 }]
    })

    expect(push).toHaveBeenCalledWith('/travel')
  })

  it('allows swipe navigation when the gesture starts inside the bottom nav', () => {
    usePathnameMock.mockReturnValue('/closet')

    render(
      <AppChrome>
        <div>page body</div>
      </AppChrome>
    )

    const navLink = screen.getByRole('link', { name: 'Travel' })

    fireEvent.touchStart(navLink, {
      touches: [{ clientX: 240, clientY: 740 }]
    })
    fireEvent.touchEnd(navLink, {
      changedTouches: [{ clientX: 120, clientY: 744 }]
    })

    expect(push).toHaveBeenCalledWith('/travel')
  })

  it('ignores swipe navigation from interactive targets', () => {
    usePathnameMock.mockReturnValue('/closet')

    render(
      <AppChrome>
        <button type="button">tap target</button>
      </AppChrome>
    )

    const button = screen.getByRole('button', { name: 'tap target' })

    fireEvent.touchStart(button, {
      touches: [{ clientX: 240, clientY: 320 }]
    })
    fireEvent.touchEnd(button, {
      changedTouches: [{ clientX: 120, clientY: 320 }]
    })

    expect(push).not.toHaveBeenCalled()
  })
})
