import { getWeatherEnv } from '@/lib/env'
import type { TodayWeather } from '@/lib/today/types'

export async function getWeather(city: string): Promise<TodayWeather | null> {
  const { apiKey, baseUrl } = getWeatherEnv()
  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: 'metric'
  })

  const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    name?: string
    weather?: Array<{ description?: string }>
    main?: { temp?: number }
  }

  const temperature = payload.main?.temp
  const conditionLabel = payload.weather?.[0]?.description
  const normalizedCity = payload.name

  if (typeof temperature !== 'number' || !conditionLabel || !normalizedCity) {
    return null
  }

  return {
    city: normalizedCity,
    temperatureC: Math.round(temperature),
    conditionLabel,
    isWarm: temperature >= 24,
    isCold: temperature <= 12
  }
}
