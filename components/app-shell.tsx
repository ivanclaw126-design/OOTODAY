import type { ReactNode } from 'react'
import Link from 'next/link'
import { FeedbackLink } from '@/components/beta/feedback-link'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-44 md:pb-10">
      <header className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-1.5 pt-3 sm:px-6 sm:pb-2 sm:pt-5 md:pl-28 lg:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">OOTODAY</p>
            <h1
              aria-label={title}
              className="max-w-2xl text-[1.28rem] leading-[0.94] font-semibold tracking-[-0.04em] text-[var(--color-primary)] sm:text-[1.85rem]"
            >
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/settings"
              className="group inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold tracking-[0.04em] text-white shadow-[0_14px_32px_rgba(21,21,18,0.18)] hover:-translate-y-0.5"
            >
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)]">
                <span className="absolute h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-white/90" />
              </span>
              AI 造型引擎
            </Link>
            <FeedbackLink
              surface={`app_shell:${title.toLowerCase()}`}
              label="提反馈"
              className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
            />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 sm:px-6 md:pl-28 lg:px-6">{children}</main>
    </div>
  )
}
