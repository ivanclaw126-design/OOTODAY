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
      data-app-swipe-zone
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-3 sm:px-4"
    >
      <ul className="pointer-events-auto relative mx-auto grid max-w-[26rem] min-w-0 grid-cols-5 items-center gap-1 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,239,231,0.96)_100%)] px-2 py-1.5 shadow-[0_20px_44px_rgba(17,14,9,0.18),0_1px_0_rgba(255,255,255,0.92)_inset] backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-3 before:top-1 before:h-px before:rounded-full before:bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.95)_20%,rgba(255,255,255,0.95)_80%,rgba(255,255,255,0)_100%)] before:content-['']">
        {links.map((link) => (
          <li key={link.href} className="min-w-0 flex-1">
            <Link
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`group relative flex min-h-[3.2rem] w-full flex-col items-center justify-center rounded-[1.2rem] px-2 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.08em] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] ${
                pathname === link.href
                  ? 'bg-[var(--color-primary)] text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
                  : 'text-[rgba(82,82,82,0.74)] hover:bg-black/4 hover:text-[var(--color-primary)]'
              }`}
              href={link.href}
            >
              <span>{link.label}</span>
              <span
                aria-hidden="true"
                className={`mt-1 h-[2px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  pathname === link.href ? 'w-4 bg-[var(--color-accent)] opacity-100' : 'w-2 bg-[rgba(26,26,26,0.24)] opacity-0'
                }`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
