import { getWeatherEnv } from '@/lib/env'
import type { TodayWeather } from '@/lib/today/types'

type WeatherPayload = {
  name?: string
  weather?: Array<{ description?: string }>
  main?: { temp?: number }
}

async function readWeather(url: string) {
  const response = await fetch(url, {
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }

  return ((await response.json()) as WeatherPayload) ?? null
}

function normalizeWeather(payload: WeatherPayload): TodayWeather | null {
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

async function getWeatherByGeocoding(city: string, apiKey: string, baseUrl: string) {
  const geoParams = new URLSearchParams({
    q: city,
    limit: '1',
    appid: apiKey
  })

  const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?${geoParams.toString()}`, {
    cache: 'no-store'
  })

  if (!geoResponse.ok) {
    return null
  }

  const geoPayload = (await geoResponse.json()) as Array<{ lat?: number; lon?: number }>
  const match = geoPayload[0]

  if (typeof match?.lat !== 'number' || typeof match?.lon !== 'number') {
    return null
  }

  const searchParams = new URLSearchParams({
    lat: String(match.lat),
    lon: String(match.lon),
    appid: apiKey,
    units: 'metric'
  })

  return readWeather(`${baseUrl}?${searchParams.toString()}`)
}

export async function getWeather(city: string): Promise<TodayWeather | null> {
  let apiKey: string
  let baseUrl: string

  try {
    ;({ apiKey, baseUrl } = getWeatherEnv())
  } catch {
    return null
  }

  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: 'metric'
  })

  const directPayload = await readWeather(`${baseUrl}?${searchParams.toString()}`)
  const directWeather = directPayload ? normalizeWeather(directPayload) : null

  if (directWeather) {
    return directWeather
  }

  const geocodedPayload = await getWeatherByGeocoding(city, apiKey, baseUrl)

  if (!geocodedPayload) {
    return null
  }

  return normalizeWeather(geocodedPayload)
}
