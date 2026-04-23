import type { ReactNode } from 'react'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-36 md:pb-24">
      <header className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">OOTODAY / AI wardrobe system</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-dark)] shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Palette A
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">V1.0 / {title}</p>
          <h1 aria-label={title} className="max-w-2xl text-[2rem] leading-[0.96] font-semibold tracking-[-0.05em] text-[var(--color-primary)] sm:text-[2.4rem]">
            {title === 'Today'
              ? ': // Daily aesthetic engine'
              : title === 'Closet'
                ? ': // Personal archive control'
                : `: // ${title}`}
          </h1>
          <p className="max-w-xl text-xs text-[var(--color-neutral-dark)] sm:text-sm">
            保留原来的使用路径，但把首屏尽量让给真正可操作的信息。
          </p>
        </div>

        <div className="h-px w-full bg-[linear-gradient(90deg,var(--color-primary),rgba(9,9,9,0.08)_42%,transparent_72%)]" />
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6">{children}</main>
    </div>
  )
}
