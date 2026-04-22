import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from '@/components/app-shell'

describe('AppShell', () => {
  it('renders the page title and all primary navigation links', () => {
    render(
      <AppShell title="Today">
        <div>page body</div>
      </AppShell>
    )

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('href', '/today')
    expect(screen.getByRole('link', { name: 'Closet' })).toHaveAttribute('href', '/closet')
    expect(screen.getByRole('link', { name: 'Travel' })).toHaveAttribute('href', '/travel')
    expect(screen.getByRole('link', { name: 'Inspiration' })).toHaveAttribute('href', '/inspiration')
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop')
  })
})
