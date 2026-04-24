'use client'

import type { ReactNode } from 'react'

export function VisualChoiceCard({
  ariaLabel,
  title,
  description,
  selected,
  onClick,
  visual,
  compact = false
}: {
  ariaLabel?: string
  title: string
  description: string
  selected: boolean
  onClick: () => void
  visual: ReactNode
  compact?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'group flex h-full flex-col items-stretch gap-3 rounded-[1.2rem] border p-3 text-left transition',
        compact ? 'min-h-[16.5rem]' : 'min-h-[18.5rem]',
        selected
          ? 'border-[var(--color-primary)] bg-white shadow-[0_16px_34px_rgba(0,0,0,0.12)]'
          : 'border-[var(--color-line)] bg-white/62 hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--shadow-soft)]'
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center justify-center overflow-hidden rounded-[0.9rem] border border-[var(--color-line)] bg-[rgba(246,241,232,0.82)] p-1.5',
          compact ? 'h-[10.5rem]' : 'h-[12.5rem]'
        ].join(' ')}
      >
        {visual}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p>
          <span
            className={[
              'h-3 w-3 rounded-full border',
              selected ? 'border-[var(--color-primary)] bg-[var(--color-accent)]' : 'border-[var(--color-line)] bg-white'
            ].join(' ')}
            aria-hidden="true"
          />
        </div>
        <p className="text-xs leading-5 text-[var(--color-neutral-dark)]">{description}</p>
      </div>
    </button>
  )
}
