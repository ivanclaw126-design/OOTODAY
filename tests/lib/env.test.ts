import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('getEnv', () => {
  it('returns the required public Supabase variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubEnv('NEXT_PUBLIC_STORAGE_BUCKET', 'ootd-images')

    const { getEnv } = await import('@/lib/env')

    expect(getEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      storageBucket: 'ootd-images'
    })
  })
})

describe('getWeatherEnv', () => {
  it('returns the configured weather API values', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')
    vi.stubEnv('WEATHER_BASE_URL', 'https://api.example.com/weather')

    const { getWeatherEnv } = await import('@/lib/env')

    expect(getWeatherEnv()).toEqual({
      apiKey: 'weather-key',
      baseUrl: 'https://api.example.com/weather'
    })
  })

  it('defaults the weather base url when only the key is set', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    const { getWeatherEnv } = await import('@/lib/env')

    expect(getWeatherEnv()).toEqual({
      apiKey: 'weather-key',
      baseUrl: 'https://api.openweathermap.org/data/2.5/weather'
    })
  })
})
