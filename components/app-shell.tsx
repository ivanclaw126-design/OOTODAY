import type { ReactNode } from 'react'
import { BottomNav } from '@/components/bottom-nav'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5ee_0%,#fafafa_38%,#f4efe6_100%)] pb-40 md:pb-16">
      <header className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-5 pt-6 sm:px-6 sm:pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">OOTODAY</p>
        <div className="space-y-1">
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h1>
          <div className="h-px w-16 bg-[linear-gradient(90deg,var(--color-accent),rgba(59,130,246,0.05))]" />
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 sm:px-6">{children}</main>
      <BottomNav />
    </div>
  )
}
