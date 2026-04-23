import type { ReactNode } from 'react'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-36 md:pb-24">
      <header className="mx-auto flex max-w-4xl flex-col gap-1 px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">OOTODAY</p>
        <h1 aria-label={title} className="max-w-2xl text-[1.7rem] leading-[1] font-semibold tracking-[-0.04em] text-[var(--color-primary)] sm:text-[2rem]">
          {title}
        </h1>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 sm:px-6">{children}</main>
    </div>
  )
}
