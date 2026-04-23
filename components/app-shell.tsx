import type { ReactNode } from 'react'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-44 md:pb-28">
      <header className="mx-auto flex max-w-4xl flex-col gap-1 px-4 pb-1.5 pt-3 sm:px-6 sm:pb-2 sm:pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">OOTODAY</p>
        <h1
          aria-label={title}
          className="max-w-2xl text-[1.28rem] leading-[0.94] font-semibold tracking-[-0.04em] text-[var(--color-primary)] sm:text-[1.85rem]"
        >
          {title}
        </h1>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 sm:px-6">{children}</main>
    </div>
  )
}
