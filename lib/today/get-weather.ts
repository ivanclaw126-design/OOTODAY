import { getWeatherEnv } from '@/lib/env'
import type { TodayTargetDate, TodayWeather } from '@/lib/today/types'

type WeatherPayload = {
  name?: string
  weather?: Array<{ description?: string; main?: string }>
  main?: { temp?: number }
}

type ForecastPayload = {
  city?: {
    name?: string
    timezone?: number
  }
  list?: ForecastEntry[]
}

type ForecastEntry = {
  dt?: number
  dt_txt?: string
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

async function readForecast(url: string) {
  const response = await fetch(url, {
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }

  return ((await response.json()) as ForecastPayload) ?? null
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

function getForecastBaseUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl)
    url.pathname = url.pathname.replace(/\/weather\/?$/u, '/forecast')
    return url.toString()
  } catch {
    return baseUrl.replace(/\/weather\/?$/u, '/forecast')
  }
}

function getLocalDateParts(timestampSeconds: number, timezoneSeconds: number) {
  const localDate = new Date((timestampSeconds + timezoneSeconds) * 1000)

  return {
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth(),
    date: localDate.getUTCDate(),
    hour: localDate.getUTCHours()
  }
}

function dateKey(parts: Pick<ReturnType<typeof getLocalDateParts>, 'year' | 'month' | 'date'>) {
  return `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.date).padStart(2, '0')}`
}

function getTomorrowDateKey(timezoneSeconds: number) {
  const nowLocal = new Date(Date.now() + timezoneSeconds * 1000)
  const tomorrowLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate() + 1))

  return dateKey({
    year: tomorrowLocal.getUTCFullYear(),
    month: tomorrowLocal.getUTCMonth(),
    date: tomorrowLocal.getUTCDate()
  })
}

function getForecastEntryTimestamp(entry: ForecastEntry) {
  if (typeof entry.dt === 'number') {
    return entry.dt
  }

  if (!entry.dt_txt) {
    return null
  }

  const timestamp = Date.parse(`${entry.dt_txt.replace(' ', 'T')}Z`)

  return Number.isNaN(timestamp) ? null : Math.round(timestamp / 1000)
}

function getDominantForecastCondition(entries: ForecastEntry[]) {
  const counts = new Map<string, { count: number; description: string; main?: string }>()

  entries.forEach((entry) => {
    const condition = entry.weather?.[0]

    if (!condition?.description) {
      return
    }

    const key = `${condition.main ?? ''}|${condition.description}`
    const current = counts.get(key)

    counts.set(key, {
      count: (current?.count ?? 0) + 1,
      description: condition.description,
      main: condition.main
    })
  })

  return [...counts.values()].sort((left, right) => right.count - left.count)[0] ?? null
}

function normalizeForecastWeather(payload: ForecastPayload): TodayWeather | null {
  const city = payload.city?.name
  const timezoneSeconds = payload.city?.timezone ?? 0
  const targetDateKey = getTomorrowDateKey(timezoneSeconds)
  const forecastEntries = payload.list ?? []
  const tomorrowEntries = forecastEntries.filter((entry) => {
    const timestamp = getForecastEntryTimestamp(entry)

    if (timestamp === null) {
      return false
    }

    return dateKey(getLocalDateParts(timestamp, timezoneSeconds)) === targetDateKey
  })
  const daytimeEntries = tomorrowEntries.filter((entry) => {
    const timestamp = getForecastEntryTimestamp(entry)

    if (timestamp === null) {
      return false
    }

    const { hour } = getLocalDateParts(timestamp, timezoneSeconds)
    return hour >= 9 && hour <= 18
  })
  const representativeEntries = daytimeEntries.length > 0 ? daytimeEntries : tomorrowEntries
  const temperatures = representativeEntries
    .map((entry) => entry.main?.temp)
    .filter((temperature): temperature is number => typeof temperature === 'number')
  const condition = getDominantForecastCondition(representativeEntries)

  if (!city || temperatures.length === 0 || !condition) {
    return null
  }

  const temperature = temperatures.reduce((sum, item) => sum + item, 0) / temperatures.length

  return {
    city,
    temperatureC: Math.round(temperature),
    conditionLabel: localizeConditionLabel(condition.description, condition.main),
    isWarm: temperature >= 24,
    isCold: temperature <= 12,
    targetDate: 'tomorrow',
    sourceLabel: '明天白天预报'
  }
}

async function getLocationByGeocoding(city: string, apiKey: string) {
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

  return match
}

async function getWeatherByGeocoding(city: string, apiKey: string, baseUrl: string) {
  const match = await getLocationByGeocoding(city, apiKey)

  if (!match) {
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

async function getForecastByGeocoding(city: string, apiKey: string, forecastBaseUrl: string) {
  const match = await getLocationByGeocoding(city, apiKey)

  if (!match) {
    return null
  }

  const searchParams = new URLSearchParams({
    lat: String(match.lat),
    lon: String(match.lon),
    appid: apiKey,
    units: 'metric',
    lang: 'zh_cn'
  })

  return readForecast(`${forecastBaseUrl}?${searchParams.toString()}`)
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

export async function getWeatherForTarget(city: string, targetDate: TodayTargetDate): Promise<TodayWeather | null> {
  if (targetDate === 'today') {
    const weather = await getWeather(city)

    return weather ? { ...weather, targetDate: 'today', sourceLabel: '当前天气' } : null
  }

  let apiKey: string
  let baseUrl: string

  try {
    ;({ apiKey, baseUrl } = getWeatherEnv())
  } catch {
    return null
  }

  const forecastBaseUrl = getForecastBaseUrl(baseUrl)
  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: 'metric',
    lang: 'zh_cn'
  })
  const directPayload = await readForecast(`${forecastBaseUrl}?${searchParams.toString()}`)
  const directWeather = directPayload ? normalizeForecastWeather(directPayload) : null

  if (directWeather) {
    return directWeather
  }

  const geocodedPayload = await getForecastByGeocoding(city, apiKey, forecastBaseUrl)

  if (!geocodedPayload) {
    return null
  }

  return normalizeForecastWeather(geocodedPayload)
}
