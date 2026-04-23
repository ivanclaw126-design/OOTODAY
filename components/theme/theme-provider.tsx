'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

export const themeOptions = [
  {
    id: 'acid-paper',
    shortLabel: 'A',
    label: 'Acid Paper',
    description: '明亮纸感和酸性黄绿强调，适合把 Today 做成轻快但仍然有判断力的时尚工具。',
    accentLabel: 'Default editorial mode',
    swatches: ['#090909', '#f7f3eb', '#e7ff37', '#ebe4d8']
  },
  {
    id: 'gallery-blue',
    shortLabel: 'B',
    label: 'Gallery Blue',
    description: '偏 fashion-tech 的冷静蓝色，把界面拉向更数字化、更未来感的画廊气质。',
    accentLabel: 'Fashion tech focus',
    swatches: ['#10131b', '#f4efe7', '#7da8ff', '#0e1220']
  },
  {
    id: 'bordeaux-night',
    shortLabel: 'C',
    label: 'Bordeaux Night',
    description: '酒红和暖纸底更偏高级编辑感，适合强调穿搭判断和风格成熟度。',
    accentLabel: 'Luxury editorial tone',
    swatches: ['#180f12', '#f6efe8', '#d98a82', '#14090d']
  },
  {
    id: 'sage-archive',
    shortLabel: 'D',
    label: 'Sage Archive',
    description: '鼠尾草绿更克制耐看，适合长期管理衣橱和做日常记录时的低压氛围。',
    accentLabel: 'Calm wardrobe archive',
    swatches: ['#101411', '#f1f0e8', '#8fb79b', '#dde2d4']
  }
] as const

export type ThemeId = (typeof themeOptions)[number]['id']

const DEFAULT_THEME: ThemeId = 'acid-paper'
const THEME_STORAGE_KEY = 'ootoday-theme'
const THEME_EVENT = 'ootoday-theme-change'

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {}
})

function isThemeId(value: string | null): value is ThemeId {
  return themeOptions.some((theme) => theme.id === value)
}

function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME
}

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme
}

function notifyThemeChange(theme: ThemeId) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new Event(THEME_EVENT))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => {}
      }

      const handleStorage = (event: StorageEvent) => {
        if (!event.key || event.key === THEME_STORAGE_KEY) {
          onStoreChange()
        }
      }

      const handleThemeChange = () => {
        onStoreChange()
      }

      window.addEventListener('storage', handleStorage)
      window.addEventListener(THEME_EVENT, handleThemeChange)

      return () => {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener(THEME_EVENT, handleThemeChange)
      }
    },
    getStoredTheme,
    () => DEFAULT_THEME
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(nextTheme: ThemeId) {
    const nextDocument = document as Document & {
      startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> }
    }

    document.documentElement.dataset.themeSwitching = 'true'

    if (typeof nextDocument.startViewTransition === 'function') {
      const transition = nextDocument.startViewTransition(() => {
        notifyThemeChange(nextTheme)
      })

      void transition.finished.finally(() => {
        document.documentElement.removeAttribute('data-theme-switching')
      })

      return
    }

    notifyThemeChange(nextTheme)
    window.setTimeout(() => {
      document.documentElement.removeAttribute('data-theme-switching')
    }, 420)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
