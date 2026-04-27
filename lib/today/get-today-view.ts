import { getClosetView } from '@/lib/closet/get-closet-view'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { getRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { getCandidateModelScoreMap, getEntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { getRecommendationTrendSignals } from '@/lib/recommendation/get-trend-signals'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getRecentOotdHistory } from '@/lib/today/get-recent-ootd-history'
import { getCachedTodayRecommendations, saveTodayRecommendationCache } from '@/lib/today/recommendation-cache'
import { getTodayOotdStatus } from '@/lib/today/get-today-ootd-status'
import { getWeatherForTarget } from '@/lib/today/get-weather'
import type { TodayRecommendation, TodayScene, TodayTargetDate, TodayView, TodayWeatherState } from '@/lib/today/types'

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
  const [closet, ootdStatus, recentOotdHistory, preferenceState, modelScoreMap, entityModelScoreMap, trendSignals, learningSignals] = await Promise.all([
    getClosetView(userId, { limit: 0 }),
    getTodayOotdStatus(userId),
    getRecentOotdHistory(userId),
    getPreferenceState({ userId }),
    getCandidateModelScoreMap({ userId, surface: 'today' }),
    getEntityModelScoreMap({ userId, surface: 'today' }),
    getRecommendationTrendSignals(),
    getRecommendationLearningSignals({ userId, surface: 'today' })
  ])
  const hasCompletedStyleQuestionnaire = preferenceState.hasQuestionnaireAnswers === true
  const recommendationSignalParams = {
    ...(Object.keys(modelScoreMap).length > 0 ? { modelScoreMap } : {}),
    ...(Object.keys(entityModelScoreMap).length > 0 ? { entityModelScoreMap } : {}),
    ...(trendSignals.length > 0 ? { trendSignals } : {}),
    ...(learningSignals.length > 0 ? { learningSignals } : {})
  }

  if (closet.itemCount === 0) {
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
      recentOotdHistory
    }
  }

  if (!city) {
    const weatherState = { status: 'not-set' as const, targetDate }
    const stableRecommendations = await getStableRecommendations({
      userId,
      city: null,
      itemCount: closet.itemCount,
      items: closet.items,
      weather: null,
      weatherState,
      offset,
      preferenceState,
      targetDate,
      scene,
      recommendationSignalParams
    })

    return {
      itemCount: closet.itemCount,
      city: null,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      targetDate,
      scene,
      weatherState,
      recommendations: stableRecommendations.recommendations,
      recommendationSource: stableRecommendations.source,
      recommendationError: false,
      ootdStatus,
      recentOotdHistory
    }
  }

  const weather = await getWeatherForTarget(city, targetDate)

  if (!weather) {
    const weatherState = { status: 'unavailable' as const, city, targetDate }
    const stableRecommendations = await getStableRecommendations({
      userId,
      city,
      itemCount: closet.itemCount,
      items: closet.items,
      weather: null,
      weatherState,
      offset,
      preferenceState,
      targetDate,
      scene,
      recommendationSignalParams
    })

    return {
      itemCount: closet.itemCount,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      targetDate,
      scene,
      weatherState,
      recommendations: stableRecommendations.recommendations,
      recommendationSource: stableRecommendations.source,
      recommendationError: false,
      ootdStatus,
      recentOotdHistory
    }
  }

  const weatherState = { status: 'ready' as const, weather, targetDate }
  const stableRecommendations = await getStableRecommendations({
    userId,
    city,
    itemCount: closet.itemCount,
    items: closet.items,
    weather,
    weatherState,
    offset,
    preferenceState,
    targetDate,
    scene,
    recommendationSignalParams
  })

  return {
    itemCount: closet.itemCount,
    city,
    accountEmail,
    passwordBootstrapped,
    passwordChangedAt,
    hasCompletedStyleQuestionnaire,
    targetDate,
    scene,
    weatherState,
    recommendations: stableRecommendations.recommendations,
    recommendationSource: stableRecommendations.source,
    recommendationError: false,
    ootdStatus,
    recentOotdHistory
  }
}
