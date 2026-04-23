'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/today', label: 'Today' },
  { href: '/closet', label: 'Closet' },
  { href: '/travel', label: 'Travel' },
  { href: '/inspiration', label: 'Inspiration' },
  { href: '/shop', label: 'Shop' }
] as const

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLUListElement | null>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0
  })
  const activeIndex = useMemo(() => links.findIndex((link) => pathname === link.href), [pathname])
  const displayIndex = dragIndex ?? Math.max(activeIndex, 0)

  function getIndexFromClientX(clientX: number, target?: EventTarget | null) {
    const nav = navRef.current

    if (!nav) {
      return activeIndex
    }

    const rect = nav.getBoundingClientRect()

    if (rect.width <= 0 && target instanceof HTMLElement) {
      const indexValue = target.closest<HTMLElement>('[data-nav-index]')?.dataset.navIndex
      return indexValue ? Number.parseInt(indexValue, 10) : activeIndex
    }

    const measuredItems = itemRefs.current
      .map((item, index) => {
        if (!item) {
          return null
        }

        const itemRect = item.getBoundingClientRect()

        if (itemRect.width <= 0) {
          return null
        }

        return {
          index,
          center: itemRect.left + itemRect.width / 2
        }
      })
      .filter((item): item is { index: number; center: number } => item !== null)

    if (measuredItems.length === 0) {
      const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width - 1)
      return Math.max(0, Math.min(links.length - 1, Math.floor((relativeX / rect.width) * links.length)))
    }

    return measuredItems.reduce((closestIndex, item) => {
      const currentDistance = Math.abs(item.center - clientX)
      const closestItem = measuredItems.find((candidate) => candidate.index === closestIndex)
      const closestDistance = closestItem ? Math.abs(closestItem.center - clientX) : Number.POSITIVE_INFINITY

      return currentDistance < closestDistance ? item.index : closestIndex
    }, activeIndex >= 0 ? activeIndex : 0)
  }

  useEffect(() => {
    function updateIndicator() {
      const nav = navRef.current
      const activeItem = itemRefs.current[displayIndex]

      if (!nav || !activeItem) {
        return
      }

      const navRect = nav.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      if (navRect.width <= 0 || itemRect.width <= 0) {
        return
      }

      setIndicatorStyle({
        left: itemRect.left - navRect.left,
        width: itemRect.width,
        opacity: 1
      })
    }

    const frame = window.requestAnimationFrame(updateIndicator)
    window.addEventListener('resize', updateIndicator)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [displayIndex, pathname])

  return (
    <nav
      aria-label="Primary"
      data-app-swipe-zone
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-3 sm:px-4"
    >
      <ul
        ref={navRef}
        className="pointer-events-auto relative mx-auto grid max-w-[26rem] min-w-0 grid-cols-5 items-center gap-1 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,239,231,0.96)_100%)] px-2 py-1.5 shadow-[0_20px_44px_rgba(17,14,9,0.18),0_1px_0_rgba(255,255,255,0.92)_inset] backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-3 before:top-1 before:h-px before:rounded-full before:bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.95)_20%,rgba(255,255,255,0.95)_80%,rgba(255,255,255,0)_100%)] before:content-['']"
        onTouchStart={(event) => {
          event.stopPropagation()
          const touch = event.touches[0]

          if (!touch) {
            return
          }

          setDragIndex(getIndexFromClientX(touch.clientX, event.target))
        }}
        onTouchMove={(event) => {
          event.stopPropagation()
          const touch = event.touches[0]

          if (!touch) {
            return
          }

          setDragIndex(getIndexFromClientX(touch.clientX, event.target))
        }}
        onTouchEnd={(event) => {
          event.stopPropagation()
          const touch = event.changedTouches[0]
          const targetIndex = touch ? getIndexFromClientX(touch.clientX, event.target) : dragIndex
          setDragIndex(null)

          if (targetIndex !== null && targetIndex !== activeIndex && links[targetIndex]) {
            router.push(links[targetIndex].href)
          }
        }}
        onTouchCancel={(event) => {
          event.stopPropagation()
          setDragIndex(null)
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 top-1.5 rounded-[1.2rem] bg-[var(--color-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-[left,width,opacity] duration-200 ease-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity
          }}
        />
        {links.map((link) => (
          <li key={link.href} className="min-w-0 flex-1">
            <Link
              ref={(node) => {
                itemRefs.current[links.findIndex((candidate) => candidate.href === link.href)] = node
              }}
              data-nav-index={links.findIndex((candidate) => candidate.href === link.href)}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`group relative flex min-h-[3.2rem] w-full flex-col items-center justify-center rounded-[1.2rem] px-2 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.08em] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] ${
                pathname === link.href
                  ? 'translate-y-[-1px] text-white'
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
