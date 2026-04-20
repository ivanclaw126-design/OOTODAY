import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('getWeather', () => {
  it('normalizes a successful weather response', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Shanghai',
          weather: [{ main: 'Clouds', description: 'broken clouds' }],
          main: { temp: 18.4 }
        })
      }) as unknown as typeof fetch
    )

    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('Shanghai')).resolves.toEqual({
      city: 'Shanghai',
      temperatureC: 18,
      conditionLabel: 'broken clouds',
      isWarm: false,
      isCold: false
    })
  })

  it('returns null when the weather request fails', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    )

    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('Shanghai')).resolves.toBeNull()
  })

  it('returns null when weather config is missing', async () => {
    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('Shanghai')).resolves.toBeNull()
  })
})
