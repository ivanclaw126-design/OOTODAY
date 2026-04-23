import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-dashed border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(247,243,235,0.88))] p-7 text-center shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Next step</p>
        <h2 className="text-2xl leading-tight font-semibold tracking-[-0.04em]">{title}</h2>
      </div>
      <p className="mx-auto max-w-xl text-sm leading-7 text-[var(--color-neutral-dark)]">{description}</p>
      {action}
    </div>
  )
}
