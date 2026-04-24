import type { ReactNode } from 'react'
import Link from 'next/link'
import { FeedbackLink } from '@/components/beta/feedback-link'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-44 md:pb-28">
      <header className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-1.5 pt-3 sm:px-6 sm:pb-2 sm:pt-5">
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
              className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
            >
              设置
            </Link>
            <FeedbackLink
              surface={`app_shell:${title.toLowerCase()}`}
              label="提反馈"
              className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
            />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 sm:px-6">{children}</main>
    </div>
  )
}
