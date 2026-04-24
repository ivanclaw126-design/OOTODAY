import { getWeatherEnv } from '@/lib/env'
import type { TodayWeather } from '@/lib/today/types'

type WeatherPayload = {
  name?: string
  weather?: Array<{ description?: string; main?: string }>
  main?: { temp?: number }
}

const CONDITION_LABELS: Record<string, string> = {
  'clear sky': '晴',
  clear: '晴',
  clouds: '多云',
  'few clouds': '少云',
  'scattered clouds': '多云',
  'broken clouds': '多云',
  'overcast clouds': '阴',
  drizzle: '小雨',
  rain: '雨',
  'light rain': '小雨',
  'moderate rain': '中雨',
  'heavy intensity rain': '大雨',
  thunderstorm: '雷雨',
  snow: '雪',
  mist: '薄雾',
  fog: '雾',
  haze: '霾',
  smoke: '烟雾',
  dust: '浮尘',
  sand: '扬沙',
  squall: '飑',
  tornado: '龙卷风'
}

function localizeConditionLabel(description: string, main?: string) {
  const normalizedDescription = description.trim().toLowerCase()
  const normalizedMain = main?.trim().toLowerCase()

  return CONDITION_LABELS[normalizedDescription] ?? (normalizedMain ? CONDITION_LABELS[normalizedMain] : undefined) ?? description
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
  const condition = payload.weather?.[0]
  const conditionLabel = condition?.description
  const normalizedCity = payload.name

  if (typeof temperature !== 'number' || !conditionLabel || !normalizedCity) {
    return null
  }

  return {
    city: normalizedCity,
    temperatureC: Math.round(temperature),
    conditionLabel: localizeConditionLabel(conditionLabel, condition.main),
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
    units: 'metric',
    lang: 'zh_cn'
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
    units: 'metric',
    lang: 'zh_cn'
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
