import './globals.css'
import type { Metadata } from 'next'
import type { Viewport } from 'next'
import type { ReactNode } from 'react'
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'
import { AppChrome } from '@/components/app-chrome'

const bodyFont = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
})

const displayFont = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700']
})

export const metadata: Metadata = {
  title: 'OOTODAY',
  description: 'AI-powered personal wardrobe assistant'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}
