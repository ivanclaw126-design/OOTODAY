'use client'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

function loadStoredValue<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.sessionStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function useSessionState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadStoredValue(key, initialValue))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
