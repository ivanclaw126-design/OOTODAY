import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--color-neutral-mid)] bg-white p-6 text-center">
      <h2 className="text-xl font-medium">{title}</h2>
      <p className="text-sm text-[var(--color-neutral-dark)]">{description}</p>
      {action}
    </div>
  )
}
