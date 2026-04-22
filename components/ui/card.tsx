import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-black/7 bg-white/92 p-5 shadow-[0_14px_34px_rgba(26,26,26,0.06)] backdrop-blur">
      {children}
    </section>
  )
}
