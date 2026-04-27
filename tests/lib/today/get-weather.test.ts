import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

function forecastTimestamp(daysFromToday: number, localHour: number, timezoneSeconds = 0) {
  const nowLocal = new Date(Date.now() + timezoneSeconds * 1000)
  const localTimestamp = Date.UTC(
    nowLocal.getUTCFullYear(),
    nowLocal.getUTCMonth(),
    nowLocal.getUTCDate() + daysFromToday,
    localHour
  )

  return Math.round((localTimestamp - timezoneSeconds * 1000) / 1000)
}

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

  it('normalizes tomorrow daytime forecast for target weather', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    const timezone = 8 * 60 * 60
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        city: { name: 'Shanghai', timezone },
        list: [
          { dt: forecastTimestamp(1, 6, timezone), weather: [{ main: 'Clear', description: 'clear sky' }], main: { temp: 11 } },
          { dt: forecastTimestamp(1, 9, timezone), weather: [{ main: 'Clouds', description: 'broken clouds' }], main: { temp: 14 } },
          { dt: forecastTimestamp(1, 12, timezone), weather: [{ main: 'Rain', description: 'light rain' }], main: { temp: 16 } },
          { dt: forecastTimestamp(1, 15, timezone), weather: [{ main: 'Rain', description: 'light rain' }], main: { temp: 18 } },
          { dt: forecastTimestamp(1, 18, timezone), weather: [{ main: 'Rain', description: 'light rain' }], main: { temp: 20 } }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { getWeatherForTarget } = await import('@/lib/today/get-weather')

    await expect(getWeatherForTarget('上海', 'tomorrow')).resolves.toEqual({
      city: 'Shanghai',
      temperatureC: 17,
      conditionLabel: '小雨',
      isWarm: false,
      isCold: false,
      targetDate: 'tomorrow',
      sourceLabel: '明天白天预报'
    })

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/forecast?'), { cache: 'no-store' })
  })

  it('returns null when tomorrow forecast lookup fails', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch)

    const { getWeatherForTarget } = await import('@/lib/today/get-weather')

    await expect(getWeatherForTarget('上海', 'tomorrow')).resolves.toBeNull()
  })
})
