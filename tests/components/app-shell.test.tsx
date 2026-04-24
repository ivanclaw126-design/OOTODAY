import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from '@/components/app-shell'

describe('AppShell', () => {
  it('renders the page title, children, and AI engine entry', () => {
    render(
      <AppShell title="Today">
        <div>page body</div>
      </AppShell>
    )

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByText('page body')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI 造型引擎' })).toHaveAttribute('href', '/settings')
  })
})
