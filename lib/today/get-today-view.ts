import { getClosetItemCount, getClosetView } from '@/lib/closet/get-closet-view'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { getRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { getCandidateModelScoreMap, getEntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { getRecommendationTrendSignals } from '@/lib/recommendation/get-trend-signals'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getRecentOotdHistory } from '@/lib/today/get-recent-ootd-history'
import { getCachedTodayRecommendations, getCachedTodayRecommendationsSnapshot, saveTodayRecommendationCache } from '@/lib/today/recommendation-cache'
import { getTodayOotdStatus } from '@/lib/today/get-today-ootd-status'
import { getWeatherForTarget } from '@/lib/today/get-weather'
import type { TodayRecommendation, TodayScene, TodayTargetDate, TodayView, TodayWeatherState } from '@/lib/today/types'

const INITIAL_WEATHER_TIMEOUT_MS = 900
const ENHANCEMENT_TIMEOUT_MS = 700

async function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      promise.catch(() => fallback),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs)
      })
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

async function getWeatherStateWithTimeout(city: string | null, targetDate: TodayTargetDate) {
  if (!city) {
    return {
      weather: null,
      weatherState: { status: 'not-set' as const, targetDate },
      deferred: false
    }
  }

  const weather = await withTimeout(getWeatherForTarget(city, targetDate), null, INITIAL_WEATHER_TIMEOUT_MS)

  return {
    weather,
    weatherState: weather
      ? { status: 'ready' as const, weather, targetDate }
      : { status: 'unavailable' as const, city, targetDate },
    deferred: weather === null
  }
}

async function getStableRecommendations({
  userId,
  city,
  itemCount,
  items,
  weather,
  weatherState,
  offset,
  targetDate,
  scene,
  preferenceState,
  recommendationSignalParams
}: {
  userId: string
  city: string | null
  itemCount: number
  items: Parameters<typeof generateTodayRecommendations>[0]['items']
  weather: Parameters<typeof generateTodayRecommendations>[0]['weather']
  weatherState: TodayWeatherState
  offset: number
  targetDate: TodayTargetDate
  scene: TodayScene
  preferenceState: Parameters<typeof generateTodayRecommendations>[0]['preferenceState']
  recommendationSignalParams: Partial<Parameters<typeof generateTodayRecommendations>[0]>
}): Promise<{ recommendations: TodayRecommendation[]; source: 'cache' | 'generated' }> {
  if (offset === 0) {
    const cached = await getCachedTodayRecommendations({
      userId,
      targetDate,
      scene,
      city,
      itemCount
    })

    if (cached) {
      return {
        recommendations: cached.recommendations,
        source: 'cache'
      }
    }
  }

  const recommendations = generateTodayRecommendations({
    items,
    weather,
    offset,
    preferenceState,
    targetDate,
    scene,
    ...recommendationSignalParams
  })

  await saveTodayRecommendationCache({
    userId,
    targetDate,
    scene,
    city,
    itemCount,
    weatherState,
    recommendations
  })

  return {
    recommendations,
    source: 'generated'
  }
}

export async function getTodayView({
  userId,
  city,
  accountEmail,
  passwordBootstrapped,
  passwordChangedAt,
  offset = 0,
  targetDate = 'today',
  scene = null
}: {
  userId: string
  city: string | null
  accountEmail: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  offset?: number
  targetDate?: TodayTargetDate
  scene?: TodayScene
}): Promise<TodayView> {
  const [itemCount, ootdStatus, preferenceState, cachedRecommendations] = await Promise.all([
    getClosetItemCount(userId),
    getTodayOotdStatus(userId),
    getPreferenceState({ userId }),
    offset === 0
      ? getCachedTodayRecommendationsSnapshot({
          userId,
          targetDate,
          scene,
          city
        })
      : Promise.resolve(null)
  ])
  const hasCompletedStyleQuestionnaire = preferenceState.hasQuestionnaireAnswers === true
  const continuousRefresh = {
    enabled: true,
    exploration: preferenceState.profile?.exploration ?? DEFAULT_PREFERENCE_PROFILE.exploration
  }

  if (itemCount === 0) {
    return {
      itemCount: 0,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      targetDate,
      scene,
      weatherState: city ? { status: 'unavailable', city, targetDate } : { status: 'not-set', targetDate },
      recommendations: [],
      recommendationSource: 'empty',
      recommendationError: false,
      ootdStatus,
      recentOotdHistory: [],
      recentOotdHistoryDeferred: true,
      weatherDeferred: Boolean(city),
      continuousRefresh
    }
  }

  if (cachedRecommendations && cachedRecommendations.itemCount === itemCount) {
    return {
      itemCount,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      targetDate,
      scene,
      weatherState: cachedRecommendations.weatherState,
      recommendations: cachedRecommendations.recommendations,
      recommendationSource: 'cache',
      recommendationError: false,
      ootdStatus,
      recentOotdHistory: [],
      recentOotdHistoryDeferred: true,
      weatherDeferred: Boolean(city) && cachedRecommendations.weatherState.status !== 'ready',
      continuousRefresh
    }
  }

  const [
    closet,
    recentOotdHistory,
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weatherResult
  ] = await Promise.all([
    getClosetView(userId, { limit: 0 }),
    getRecentOotdHistory(userId),
    withTimeout(getCandidateModelScoreMap({ userId, surface: 'today' }), {}, ENHANCEMENT_TIMEOUT_MS),
    withTimeout(getEntityModelScoreMap({ userId, surface: 'today' }), {}, ENHANCEMENT_TIMEOUT_MS),
    withTimeout(getRecommendationTrendSignals(), [], ENHANCEMENT_TIMEOUT_MS),
    withTimeout(getRecommendationLearningSignals({ userId, surface: 'today' }), [], ENHANCEMENT_TIMEOUT_MS),
    getWeatherStateWithTimeout(city, targetDate)
  ])
  const recommendationSignalParams = {
    ...(Object.keys(modelScoreMap).length > 0 ? { modelScoreMap } : {}),
    ...(Object.keys(entityModelScoreMap).length > 0 ? { entityModelScoreMap } : {}),
    ...(trendSignals.length > 0 ? { trendSignals } : {}),
    ...(learningSignals.length > 0 ? { learningSignals } : {})
  }

  const stableRecommendations = await getStableRecommendations({
    userId,
    city,
    itemCount,
    items: closet.items,
    weather: weatherResult.weather,
    weatherState: weatherResult.weatherState,
    offset,
    preferenceState,
    targetDate,
    scene,
    recommendationSignalParams
  })

  return {
    itemCount,
    city,
    accountEmail,
    passwordBootstrapped,
    passwordChangedAt,
    hasCompletedStyleQuestionnaire,
    targetDate,
    scene,
    weatherState: weatherResult.weatherState,
    recommendations: stableRecommendations.recommendations,
    recommendationSource: stableRecommendations.source,
    recommendationError: false,
    ootdStatus,
    recentOotdHistory,
    weatherDeferred: weatherResult.deferred,
    continuousRefresh
  }
}
