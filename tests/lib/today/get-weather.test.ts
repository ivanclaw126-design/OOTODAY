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
      conditionLabel: '多云',
      isWarm: false,
      isCold: false
    })

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lang=zh_cn'), { cache: 'no-store' })
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

  it('falls back to geocoding when the direct city lookup fails', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: 31.2222, lon: 121.4581 }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Shanghai',
          weather: [{ main: 'Mist', description: 'mist' }],
          main: { temp: 17.92 }
        })
      })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('上海')).resolves.toEqual({
      city: 'Shanghai',
      temperatureC: 18,
      conditionLabel: '薄雾',
      isWarm: false,
      isCold: false
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]?.[0]).toContain('geo/1.0/direct')
    expect(fetchMock.mock.calls[2]?.[0]).toContain('lat=31.2222')
    expect(fetchMock.mock.calls[2]?.[0]).toContain('lon=121.4581')
    expect(fetchMock.mock.calls[2]?.[0]).toContain('lang=zh_cn')
  })

  it('keeps already localized weather descriptions unchanged', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Shanghai',
          weather: [{ main: 'Clear', description: '晴' }],
          main: { temp: 16.2 }
        })
      }) as unknown as typeof fetch
    )

    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('上海')).resolves.toMatchObject({
      conditionLabel: '晴'
    })
  })

  it('returns null when weather config is missing', async () => {
    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('Shanghai')).resolves.toBeNull()
  })
})
