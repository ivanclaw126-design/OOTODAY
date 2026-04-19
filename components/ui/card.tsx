import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-lg bg-white p-4 shadow-sm">{children}</section>
}
