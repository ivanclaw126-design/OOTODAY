'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { ThemeProvider } from '@/components/theme/theme-provider'

const appRoutes = ['/closet', '/travel', '/today', '/inspiration', '/shop'] as const

function isAppRoute(pathname: string) {
  return appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

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

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        {children}
        {shouldShowBottomNav ? <BottomNav /> : null}
      </div>
    </ThemeProvider>
  )
}
