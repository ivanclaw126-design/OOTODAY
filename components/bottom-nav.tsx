 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/today', label: 'Today' },
  { href: '/closet', label: 'Closet' },
  { href: '/travel', label: 'Travel' },
  { href: '/inspiration', label: 'Inspiration' },
  { href: '/shop', label: 'Shop' }
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4 md:static md:px-0 md:pb-0 md:pt-1"
    >
      <ul className="mx-auto flex max-w-3xl items-center justify-between gap-1 rounded-[1.75rem] border border-black/8 bg-white/88 px-2 py-2 shadow-[0_18px_42px_rgba(26,26,26,0.10)] backdrop-blur md:rounded-[1.4rem] md:bg-white/72">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                pathname === link.href
                  ? 'bg-[var(--color-primary)] text-white shadow-[0_10px_24px_rgba(26,26,26,0.18)]'
                  : 'text-[var(--color-neutral-dark)] hover:bg-black/4 hover:text-[var(--color-primary)]'
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
