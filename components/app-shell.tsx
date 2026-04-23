import type { ReactNode } from 'react'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5ee_0%,#fafafa_38%,#f4efe6_100%)] pb-36 md:pb-20">
      <header className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">OOTODAY</p>
        <div className="space-y-1">
          <h1 className="text-2xl leading-tight font-semibold tracking-[-0.03em] sm:text-[2rem]">{title}</h1>
          <div className="h-px w-12 bg-[linear-gradient(90deg,var(--color-accent),rgba(59,130,246,0.05))]" />
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 sm:px-6">{children}</main>
    </div>
  )
}
