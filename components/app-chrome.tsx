'use client'

import type { ReactNode, TouchEvent as ReactTouchEvent } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'

const appRoutes = ['/closet', '/travel', '/today', '/inspiration', '/shop'] as const

function isAppRoute(pathname: string) {
  return appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest('[data-app-swipe-zone]')) {
    return false
  }

  return Boolean(
    target.closest(
      'a, button, input, textarea, select, label, summary, [role="button"], [contenteditable="true"], [data-no-app-swipe]'
    )
  )
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const swipeStateRef = useRef<{ startX: number; startY: number } | null>(null)

  const currentRouteIndex = useMemo(() => appRoutes.findIndex((route) => pathname === route), [pathname])
  const shouldShowBottomNav = isAppRoute(pathname)

  useEffect(() => {
    if (currentRouteIndex === -1) {
      return
    }

    const previousRoute = appRoutes[currentRouteIndex - 1]
    const nextRoute = appRoutes[currentRouteIndex + 1]

    if (previousRoute) {
      router.prefetch(previousRoute)
    }

    if (nextRoute) {
      router.prefetch(nextRoute)
    }
  }, [currentRouteIndex, router])

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]

    if (!touch || !shouldShowBottomNav || currentRouteIndex === -1 || isInteractiveTarget(event.target)) {
      swipeStateRef.current = null
      return
    }

    swipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY
    }
  }

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]

    if (!touch || !swipeStateRef.current || currentRouteIndex === -1 || isInteractiveTarget(event.target)) {
      swipeStateRef.current = null
      return
    }

    const deltaX = touch.clientX - swipeStateRef.current.startX
    const deltaY = touch.clientY - swipeStateRef.current.startY
    swipeStateRef.current = null

    if (Math.abs(deltaY) > 36 || Math.abs(deltaX) < 72 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) {
      return
    }

    const nextRoute =
      deltaX < 0 ? appRoutes[currentRouteIndex + 1] ?? null : appRoutes[currentRouteIndex - 1] ?? null

    if (nextRoute) {
      router.push(nextRoute)
    }
  }

  return (
    <div
      className="min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        swipeStateRef.current = null
      }}
    >
      {children}
      {shouldShowBottomNav ? <BottomNav /> : null}
    </div>
  )
}
