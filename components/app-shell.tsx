import type { ReactNode } from 'react'
import { BottomNav } from '@/components/bottom-nav'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-neutral-light)] pb-20">
      <header className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-6">
        <p className="text-sm text-[var(--color-neutral-dark)]">OOTODAY</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4">{children}</main>
      <BottomNav />
    </div>
  )
}
