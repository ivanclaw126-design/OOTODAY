import type { ReactNode } from 'react'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[1.9rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(248,243,234,0.92)_100%)] p-5 shadow-[var(--shadow-soft)] backdrop-blur before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.88),transparent)] before:content-[''] relative overflow-hidden ${className ?? ''}`.trim()}
    >
      {children}
    </section>
  )
}
