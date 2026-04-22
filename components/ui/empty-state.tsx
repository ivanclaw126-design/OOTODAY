import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-dashed border-black/12 bg-[rgba(255,255,255,0.78)] p-7 text-center shadow-[0_14px_30px_rgba(26,26,26,0.05)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">Next step</p>
        <h2 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      <p className="mx-auto max-w-xl text-sm leading-7 text-[var(--color-neutral-dark)]">{description}</p>
      {action}
    </div>
  )
}
