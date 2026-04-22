const links = [
  { href: '/today', label: 'Today' },
  { href: '/closet', label: 'Closet' },
  { href: '/shop', label: 'Shop' }
] as const

export function BottomNav() {
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 border-t border-[var(--color-neutral-mid)] bg-white px-4 py-3">
      <ul className="mx-auto flex max-w-2xl items-center justify-around">
        {links.map((link) => (
          <li key={link.href}>
            <a className="text-sm text-[var(--color-primary)]" href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
